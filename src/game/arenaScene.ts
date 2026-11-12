import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OCTAGON_RADIUS } from '../shared/combatEngine.ts';
import {
  CombatEvent,
  FighterId,
  FighterState,
  GraphicsQuality,
  MatchState,
} from '../shared/types.ts';
import { arenaAudio } from './audio.ts';
import {
  createFighterRig,
  createRefereeRig,
  FighterRig,
  RefereeRig,
  updateFighterRig,
  updateRefereeRig,
} from './fighterRig.ts';
import {
  createArenaBannerTexture,
  createCageMeshTexture,
  createMatRoughnessTexture,
  createOctagonMatTexture,
} from './textures.ts';

export type SceneMode = 'menu' | 'select' | 'fight';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const _camDesired = new THREE.Vector3();
const _targetDesired = new THREE.Vector3();
const _camLookCurrent = new THREE.Vector3(0, 1.05, 0);
const _dummy = new THREE.Object3D();

function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class ArenaSceneController {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private quality: GraphicsQuality = 'medium';

  private keyLight: THREE.DirectionalLight;
  private crowdMesh!: THREE.InstancedMesh;
  private crowdBaseTransforms: Array<{
    x: number;
    y: number;
    z: number;
    ry: number;
    scale: number;
    phase: number;
  }> = [];
  private crowdExcitement = 0.2;

  private fighterRigs: [FighterRig, FighterRig];
  private refereeRig: RefereeRig;

  private particles: Particle[] = [];
  private shockwaveRing!: THREE.Mesh;
  private shockwaveLife = 0;
  private hitstopTimer = 0;
  private disposables: Array<{ dispose: () => void }> = [];

  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private lastProcessedEventId = 0;

  private mode: SceneMode = 'menu';
  private previewFighter: FighterId = 'jean';
  private matchStateRef: { current: MatchState | null } = { current: null };
  private onStepFrame?: (dt: number) => void;

  constructor(
    container: HTMLElement,
    initialQuality: GraphicsQuality,
    onStepFrame?: (dt: number) => void,
  ) {
    this.container = container;
    this.quality = initialQuality;
    this.onStepFrame = onStepFrame;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && initialQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && initialQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyPixelRatio();

    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const bgHex = 0x07090e;
    this.scene.background = new THREE.Color(bgHex);
    this.scene.fog = new THREE.FogExp2(bgHex, 0.024);

    // Mandatory studio environment map via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.15, 120);
    this.camera.position.set(0, 3.2, 7.6);
    this.camera.lookAt(0, 1.0, 0);

    // Lighting Rig
    const hemi = new THREE.HemisphereLight(0x88b4ff, 0x221712, 0.72);
    this.scene.add(hemi);

    this.keyLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    this.keyLight.position.set(4.5, 11.5, 5.5);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(
      initialQuality === 'high' ? 2048 : 1024,
      initialQuality === 'high' ? 2048 : 1024,
    );
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 26;
    const d = 6.5;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    // Warm red & cool blue corner rim lights + crisp front fighter fill light
    const redRim = new THREE.PointLight(0xd91e2a, 16, 18, 1.6);
    redRim.position.set(-5.8, 3.6, -2.5);
    const blueRim = new THREE.PointLight(0x1d6feb, 16, 18, 1.6);
    blueRim.position.set(5.8, 3.6, -2.5);
    const frontFill = new THREE.DirectionalLight(0xdbeafe, 0.95);
    frontFill.position.set(0, 3.0, 6.5);
    this.scene.add(redRim, blueRim, frontFill);

    this.buildArenaAndOctagon();
    this.buildCrowd();
    this.buildParticlePool();

    // Fighter rigs (Slot 0 = Jean, Slot 1 = Charles initially)
    this.fighterRigs = [createFighterRig('jean'), createFighterRig('charles')];
    this.scene.add(this.fighterRigs[0].root, this.fighterRigs[1].root);

    this.refereeRig = createRefereeRig();
    this.scene.add(this.refereeRig.root);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
    });

    this.startLoop();
  }

  private applyPixelRatio(): void {
    const cap =
      this.quality === 'low' ? 1 : this.quality === 'medium' ? 1.5 : 2;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, cap),
    );
  }

  public setQuality(q: GraphicsQuality): void {
    this.quality = q;
    this.applyPixelRatio();
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && q !== 'low';
    this.keyLight.castShadow = !this.isSoftwareGl && q !== 'low';
    if (this.crowdMesh) {
      this.crowdMesh.count =
        q === 'low'
          ? Math.floor(this.crowdBaseTransforms.length * 0.45)
          : q === 'medium'
            ? Math.floor(this.crowdBaseTransforms.length * 0.75)
            : this.crowdBaseTransforms.length;
    }
    this.handleResize();
  }

  public setMode(mode: SceneMode, previewFighter: FighterId = 'jean'): void {
    this.mode = mode;
    this.previewFighter = previewFighter;
  }

  public setMatchState(state: MatchState | null): void {
    this.matchStateRef.current = state;
    if (state) {
      this.ensureFighterProfiles(
        state.fighters[0].profileId,
        state.fighters[1].profileId,
      );
      if (state.tickCount <= 2) {
        this.lastProcessedEventId = 0;
      }
    }
  }

  public ensureFighterProfiles(p0: FighterId, p1: FighterId): void {
    if (this.fighterRigs[0].id !== p0) {
      this.scene.remove(this.fighterRigs[0].root);
      this.fighterRigs[0].disposables.forEach((d) => d.dispose());
      this.fighterRigs[0] = createFighterRig(p0);
      this.scene.add(this.fighterRigs[0].root);
    }
    if (this.fighterRigs[1].id !== p1) {
      this.scene.remove(this.fighterRigs[1].root);
      this.fighterRigs[1].disposables.forEach((d) => d.dispose());
      this.fighterRigs[1] = createFighterRig(p1);
      this.scene.add(this.fighterRigs[1].root);
    }
  }

  private buildArenaAndOctagon(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // Arena lower floor
    const arenaFloorGeo = new THREE.CircleGeometry(36, 48);
    const arenaFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0d12,
      roughness: 0.88,
      metalness: 0.1,
    });
    this.disposables.push(arenaFloorGeo, arenaFloorMat);
    const arenaFloor = new THREE.Mesh(arenaFloorGeo, arenaFloorMat);
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.position.y = -0.82;
    arenaFloor.receiveShadow = true;
    this.scene.add(arenaFloor);

    // Octagon elevated base skirt
    const baseGeo = new THREE.CylinderGeometry(
      OCTAGON_RADIUS + 0.55,
      OCTAGON_RADIUS + 0.72,
      0.8,
      8,
    );
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x11141c,
      roughness: 0.65,
      metalness: 0.25,
    });
    this.disposables.push(baseGeo, baseMat);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.y = Math.PI / 8;
    baseMesh.position.y = -0.41;
    baseMesh.receiveShadow = true;
    this.scene.add(baseMesh);

    // Octagon Canvas Mat (surface at y = 0)
    const matTex = createOctagonMatTexture(maxAniso);
    const matRoughTex = createMatRoughnessTexture();
    const matGeo = new THREE.CylinderGeometry(
      OCTAGON_RADIUS + 0.35,
      OCTAGON_RADIUS + 0.35,
      0.04,
      8,
    );
    const matMat = new THREE.MeshStandardMaterial({
      map: matTex,
      roughnessMap: matRoughTex,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.disposables.push(matTex, matRoughTex, matGeo, matMat);
    const canvasDeck = new THREE.Mesh(matGeo, matMat);
    canvasDeck.rotation.y = Math.PI / 8;
    canvasDeck.position.y = -0.02;
    canvasDeck.receiveShadow = true;
    this.scene.add(canvasDeck);

    // Apron LED Trim Ring
    const apronLedGeo = new THREE.CylinderGeometry(
      OCTAGON_RADIUS + 0.56,
      OCTAGON_RADIUS + 0.56,
      0.07,
      8,
      1,
      true,
    );
    const apronLedMat = new THREE.MeshBasicMaterial({
      color: 0xd91e2a,
      side: THREE.DoubleSide,
    });
    this.disposables.push(apronLedGeo, apronLedMat);
    const apronLed = new THREE.Mesh(apronLedGeo, apronLedMat);
    apronLed.rotation.y = Math.PI / 8;
    apronLed.position.y = -0.14;
    this.scene.add(apronLed);

    // Cage Fence Panels & Padded Corner Posts
    const cageTex = createCageMeshTexture(maxAniso);
    const fenceMat = new THREE.MeshStandardMaterial({
      map: cageTex,
      transparent: true,
      alphaTest: 0.12,
      side: THREE.DoubleSide,
      roughness: 0.42,
      metalness: 0.72,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x262b35,
      roughness: 0.3,
      metalness: 0.85,
    });
    const blackPadMat = new THREE.MeshStandardMaterial({
      color: 0x161920,
      roughness: 0.62,
      metalness: 0.08,
    });
    const redPadMat = new THREE.MeshStandardMaterial({
      color: 0xd91e2a,
      roughness: 0.48,
      metalness: 0.08,
    });
    const bluePadMat = new THREE.MeshStandardMaterial({
      color: 0x1d6feb,
      roughness: 0.48,
      metalness: 0.08,
    });
    this.disposables.push(
      cageTex,
      fenceMat,
      steelMat,
      blackPadMat,
      redPadMat,
      bluePadMat,
    );

    const fenceHeight = 1.72;
    const postGeo = new THREE.CylinderGeometry(0.11, 0.11, fenceHeight + 0.16, 12);
    this.disposables.push(postGeo);

    const corners: Array<{ x: number; z: number }> = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const cx = Math.cos(angle) * OCTAGON_RADIUS;
      const cz = Math.sin(angle) * OCTAGON_RADIUS;
      corners.push({ x: cx, z: cz });

      // Corner pad color: Red corner (-X), Blue corner (+X), Black others
      const padMat =
        i === 4 ? redPadMat : i === 0 ? bluePadMat : blackPadMat;
      const post = new THREE.Mesh(postGeo, padMat);
      post.position.set(cx, (fenceHeight + 0.12) * 0.5, cz);
      post.castShadow = true;
      this.scene.add(post);
    }

    for (let i = 0; i < 8; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 8];
      const segLen = Math.hypot(b.x - a.x, b.z - a.z);
      const midX = (a.x + b.x) * 0.5;
      const midZ = (a.z + b.z) * 0.5;
      const yaw = Math.atan2(b.x - a.x, b.z - a.z);

      // Front-side fence panels (camera side, i=1,2) kept lower-profile semi-transparent so broadcast camera is unobstructed
      const isFrontSide = midZ > 3.2;

      const panelGeo = new THREE.PlaneGeometry(segLen, fenceHeight - 0.18);
      const railGeo = new THREE.CylinderGeometry(0.055, 0.055, segLen, 10);
      this.disposables.push(panelGeo, railGeo);

      const panelMat = isFrontSide
        ? new THREE.MeshStandardMaterial({
            map: cageTex,
            transparent: true,
            opacity: 0.24,
            depthWrite: false,
            side: THREE.DoubleSide,
            roughness: 0.45,
            metalness: 0.65,
          })
        : fenceMat;
      if (isFrontSide) this.disposables.push(panelMat);

      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(midX, fenceHeight * 0.5, midZ);
      panel.rotation.y = yaw + Math.PI / 2;
      this.scene.add(panel);

      // Top & bottom padded rails
      const topRail = new THREE.Mesh(railGeo, blackPadMat);
      topRail.position.set(midX, fenceHeight - 0.04, midZ);
      topRail.rotation.z = Math.PI / 2;
      topRail.rotation.y = Math.atan2(b.z - a.z, b.x - a.x) * -1;
      // Align cylinder axis from A to B
      topRail.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize(),
      );
      this.scene.add(topRail);

      const botRail = new THREE.Mesh(railGeo, steelMat);
      botRail.position.set(midX, 0.06, midZ);
      botRail.quaternion.copy(topRail.quaternion);
      this.scene.add(botRail);
    }

    // Overhead Arena Lighting Rig Truss + Volumetric Spotlight Cones
    const trussGeo = new THREE.TorusGeometry(6.8, 0.14, 8, 8);
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1c2028,
      roughness: 0.4,
      metalness: 0.85,
    });
    const ringLedGeo = new THREE.TorusGeometry(6.6, 0.045, 6, 32);
    const ringLedMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    this.disposables.push(trussGeo, trussMat, ringLedGeo, ringLedMat);

    const truss = new THREE.Mesh(trussGeo, trussMat);
    truss.rotation.x = Math.PI / 2;
    truss.position.y = 7.2;
    const ledRing = new THREE.Mesh(ringLedGeo, ringLedMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = 7.05;
    this.scene.add(truss, ledRing);

    const coneGeo = new THREE.ConeGeometry(4.6, 7.2, 24, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.032,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.disposables.push(coneGeo, coneMat);
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    lightCone.position.y = 3.6;
    this.scene.add(lightCone);

    // Arena Jumbotron Screens (Red & Blue Backdrop like fight night)
    const redBannerTex = createArenaBannerTexture('JZN MMA', '#d91e2a', maxAniso);
    const blueBannerTex = createArenaBannerTexture('JZN MMA', '#1d6feb', maxAniso);
    const bannerGeo = new THREE.PlaneGeometry(7.2, 2.25);
    const redBannerMat = new THREE.MeshBasicMaterial({ map: redBannerTex });
    const blueBannerMat = new THREE.MeshBasicMaterial({ map: blueBannerTex });
    this.disposables.push(
      redBannerTex,
      blueBannerTex,
      bannerGeo,
      redBannerMat,
      blueBannerMat,
    );

    const screenPositions = [
      { x: -10.5, z: -10.5, ry: Math.PI / 4, mat: redBannerMat },
      { x: 10.5, z: -10.5, ry: -Math.PI / 4, mat: blueBannerMat },
      { x: 0, z: -14.2, ry: 0, mat: redBannerMat },
    ];
    for (const sp of screenPositions) {
      const scr = new THREE.Mesh(bannerGeo, sp.mat);
      scr.position.set(sp.x, 5.2, sp.z);
      scr.rotation.y = sp.ry;
      this.scene.add(scr);
    }
  }

  private buildCrowd(): void {
    // Hollow tiered stadium bleachers around the octagon (r = 9.2m to 18.6m)
    const tierMat = new THREE.MeshStandardMaterial({
      color: 0x0f1218,
      roughness: 0.9,
      metalness: 0.1,
    });
    const bleacherPoints = [
      new THREE.Vector2(9.2, -0.82),
      new THREE.Vector2(9.2, 0.15),
      new THREE.Vector2(11.4, 0.15),
      new THREE.Vector2(11.4, 1.1),
      new THREE.Vector2(13.8, 1.1),
      new THREE.Vector2(13.8, 2.05),
      new THREE.Vector2(16.2, 2.05),
      new THREE.Vector2(16.2, 3.0),
      new THREE.Vector2(18.6, 3.0),
      new THREE.Vector2(18.6, -0.82),
    ];
    const bleachersGeo = new THREE.LatheGeometry(bleacherPoints, 32);
    this.disposables.push(tierMat, bleachersGeo);
    const bleachersMesh = new THREE.Mesh(bleachersGeo, tierMat);
    this.scene.add(bleachersMesh);

    const specGeo = new THREE.CapsuleGeometry(0.18, 0.42, 4, 8);
    const specMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.disposables.push(specGeo, specMat);

    this.crowdBaseTransforms = [];
    for (let ring = 0; ring < 4; ring++) {
      const radius = 10.1 + ring * 2.35;
      const count = 34 + ring * 10;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (ring * 0.12);
        // Leave narrow aisle gaps
        if (Math.abs(Math.sin(angle * 2)) < 0.08) continue;
        this.crowdBaseTransforms.push({
          x: Math.cos(angle) * radius,
          y: 0.4 + ring * 0.95,
          z: Math.sin(angle) * radius,
          ry: -angle + Math.PI / 2,
          scale: 0.88 + ((i * 17) % 10) * 0.024,
          phase: i * 0.7 + ring * 1.3,
        });
      }
    }

    this.crowdMesh = new THREE.InstancedMesh(
      specGeo,
      specMat,
      this.crowdBaseTransforms.length,
    );
    const palette = [
      new THREE.Color(0x1f2937),
      new THREE.Color(0x374151),
      new THREE.Color(0x7f1d1d),
      new THREE.Color(0x1e3a8a),
      new THREE.Color(0x4b5563),
    ];
    this.crowdBaseTransforms.forEach((c, idx) => {
      _dummy.position.set(c.x, c.y, c.z);
      _dummy.rotation.set(0, c.ry, 0);
      _dummy.scale.setScalar(c.scale);
      _dummy.updateMatrix();
      this.crowdMesh.setMatrixAt(idx, _dummy.matrix);
      this.crowdMesh.setColorAt(idx, palette[idx % palette.length]);
    });
    this.crowdMesh.instanceMatrix.needsUpdate = true;
    if (this.crowdMesh.instanceColor) {
      this.crowdMesh.instanceColor.needsUpdate = true;
    }
    this.crowdMesh.computeBoundingSphere();
    this.scene.add(this.crowdMesh);
  }

  private buildParticlePool(): void {
    const geo = new THREE.SphereGeometry(0.036, 6, 6);
    this.disposables.push(geo);
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
      });
      this.disposables.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.3,
      });
    }

    const ringGeo = new THREE.RingGeometry(0.12, 0.22, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.disposables.push(ringGeo, ringMat);
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.visible = false;
    this.scene.add(this.shockwaveRing);
  }

  private spawnImpactBurst(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count: number,
  ): void {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (p.life <= 0) {
        p.life = 0.25 + Math.random() * 0.16;
        p.maxLife = p.life;
        p.mesh.position.set(x, y, z);
        p.mesh.visible = true;
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
        p.vx = (Math.random() - 0.5) * 3.4;
        p.vy = 0.8 + Math.random() * 2.2;
        p.vz = (Math.random() - 0.5) * 3.4;
        spawned++;
      }
    }
  }

  private processCombatEvents(events: CombatEvent[]): void {
    for (const ev of events) {
      if (ev.id <= this.lastProcessedEventId) continue;
      this.lastProcessedEventId = ev.id;

      switch (ev.type) {
        case 'strike_swing':
          arenaAudio.playStrikeSwing(!!ev.isHeavy);
          break;
        case 'strike_hit':
          arenaAudio.playStrikeHit(!!ev.isHeavy, ev.zone || 'head');
          this.spawnImpactBurst(
            ev.x,
            ev.y,
            ev.z,
            ev.isHeavy ? 0xfbbf24 : 0xe2e8f0,
            ev.isHeavy ? 10 : 5,
          );
          if (ev.targetSlot !== undefined) {
            this.fighterRigs[ev.targetSlot].hitFlashTimer = ev.isHeavy
              ? 0.22
              : 0.12;
          }
          if (ev.isHeavy) {
            this.shakeTimer = 0.18;
            this.shakeIntensity = 0.095;
            this.hitstopTimer = 0.042;
            this.crowdExcitement = Math.min(1, this.crowdExcitement + 0.38);
            this.shockwaveRing.position.set(ev.x, ev.y, ev.z);
            this.shockwaveRing.lookAt(this.camera.position);
            this.shockwaveRing.scale.setScalar(0.5);
            this.shockwaveRing.visible = true;
            this.shockwaveLife = 0.22;
          }
          break;
        case 'strike_blocked':
          arenaAudio.playBlock();
          this.spawnImpactBurst(ev.x, ev.y, ev.z, 0x93c5fd, 4);
          break;
        case 'takedown_landed':
          arenaAudio.playTakedownSlam();
          arenaAudio.playCrowdCheer(0.65);
          this.shakeTimer = 0.22;
          this.shakeIntensity = 0.11;
          this.crowdExcitement = 0.85;
          break;
        case 'knockdown':
          arenaAudio.playTakedownSlam();
          arenaAudio.playCrowdCheer(0.95);
          this.shakeTimer = 0.28;
          this.shakeIntensity = 0.14;
          this.crowdExcitement = 1.0;
          break;
        case 'round_start':
          arenaAudio.playBell(1);
          arenaAudio.playCrowdCheer(0.5);
          break;
        case 'round_end':
          arenaAudio.playBell(2);
          break;
        case 'ten_seconds':
          arenaAudio.playTenSecondClack();
          break;
        case 'ko':
          arenaAudio.playBell(3);
          arenaAudio.playCrowdCheer(1.0);
          this.shakeTimer = 0.32;
          this.shakeIntensity = 0.15;
          this.crowdExcitement = 1.0;
          break;
        default:
          break;
      }
    }
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = this.clock.elapsedTime;

      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      } else if (this.onStepFrame) {
        this.onStepFrame(dt);
      }

      if (this.shockwaveLife > 0) {
        this.shockwaveLife = Math.max(0, this.shockwaveLife - dt);
        const prog = 1 - this.shockwaveLife / 0.22;
        this.shockwaveRing.scale.setScalar(0.5 + prog * 2.6);
        (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity =
          (1 - prog) * 0.72;
        if (this.shockwaveLife <= 0) this.shockwaveRing.visible = false;
      }

      this.updateScene(elapsed, dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = requestAnimationFrame(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateScene(elapsed: number, dt: number): void {
    const state = this.matchStateRef.current;

    if (this.mode === 'menu') {
      // Showcase both fighters in ready stance facing off in center octagon
      this.ensureFighterProfiles('jean', 'charles');
      this.fighterRigs[0].root.visible = true;
      this.fighterRigs[1].root.visible = true;
      const dummy0: FighterState = {
        slot: 0,
        profileId: 'jean',
        x: -0.95,
        z: 0,
        vx: 0,
        vz: 0,
        facing: 0,
        posture: 'standing',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        headIntegrity: 100,
        bodyIntegrity: 100,
        legIntegrity: 100,
        isBlocking: false,
        blockZone: 'high',
        activeMove: 'none',
        moveTimer: 0,
        moveHasHit: false,
        comboStep: 0,
        comboWindow: 0,
        counterWindow: 0,
        stunTimer: 0,
        rockedTimer: 0,
        invulnTimer: 0,
        submissionProgress: 0,
        lastHitZone: null,
        lastHitTime: 0,
        strikesLanded: 0,
        strikesThrown: 0,
        takedownsLanded: 0,
        knockdowns: 0,
        roundDamageDealt: 0,
      };
      const dummy1: FighterState = {
        ...dummy0,
        slot: 1,
        profileId: 'charles',
        x: 0.95,
        facing: Math.PI,
      };
      updateFighterRig(this.fighterRigs[0], dummy0, elapsed, dt, false);
      updateFighterRig(this.fighterRigs[1], dummy1, elapsed, dt, false);
      updateRefereeRig(this.refereeRig, dummy0, dummy1, false, elapsed, dt);

      _camDesired.set(
        Math.sin(elapsed * 0.16) * 2.2 + 0.35,
        1.95 + Math.sin(elapsed * 0.32) * 0.12,
        4.35,
      );
      _targetDesired.set(-0.55, 0.96, 0);
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-3.5 * dt));
      _camLookCurrent.lerp(_targetDesired, 1 - Math.exp(-4.5 * dt));
      this.camera.lookAt(_camLookCurrent);
    } else if (this.mode === 'select') {
      // Hero close-up inspection facing the camera on the open left/center showcase
      this.ensureFighterProfiles('jean', 'charles');
      const idx = this.previewFighter === 'jean' ? 0 : 1;
      const otherIdx = idx === 0 ? 1 : 0;
      const heroX = -0.55;

      this.fighterRigs[idx].root.visible = true;
      this.fighterRigs[otherIdx].root.visible = false;

      const heroDummy: FighterState = {
        slot: idx,
        profileId: this.previewFighter,
        x: heroX,
        z: 0,
        vx: 0,
        vz: 0,
        facing: Math.PI / 2 + Math.sin(elapsed * 0.65) * 0.25,
        posture: 'standing',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        headIntegrity: 100,
        bodyIntegrity: 100,
        legIntegrity: 100,
        isBlocking: false,
        blockZone: 'high',
        activeMove: 'none',
        moveTimer: 0,
        moveHasHit: false,
        comboStep: 0,
        comboWindow: 0,
        counterWindow: 0,
        stunTimer: 0,
        rockedTimer: 0,
        invulnTimer: 0,
        submissionProgress: 0,
        lastHitZone: null,
        lastHitTime: 0,
        strikesLanded: 0,
        strikesThrown: 0,
        takedownsLanded: 0,
        knockdowns: 0,
        roundDamageDealt: 0,
      };

      updateFighterRig(this.fighterRigs[idx], heroDummy, elapsed, dt, false);

      _camDesired.set(-0.22, 1.32, 2.55);
      _targetDesired.set(-0.18, 1.02, 0);
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-6 * dt));
      _camLookCurrent.lerp(_targetDesired, 1 - Math.exp(-7 * dt));
      this.camera.lookAt(_camLookCurrent);
    } else if (state) {
      // Live Fight Mode
      this.fighterRigs[0].root.visible = true;
      this.fighterRigs[1].root.visible = true;
      this.processCombatEvents(state.events);
      const f0 = state.fighters[0];
      const f1 = state.fighters[1];
      const isWalkout = state.phase === 'walkout';

      updateFighterRig(this.fighterRigs[0], f0, elapsed, dt, isWalkout);
      updateFighterRig(this.fighterRigs[1], f1, elapsed, dt, isWalkout);
      updateRefereeRig(
        this.refereeRig,
        f0,
        f1,
        state.phase === 'finished',
        elapsed,
        dt,
      );

      // Dynamic Broadcast Combat Camera (keeps both fighters in frame inside octagon bounds)
      const mx = (f0.x + f1.x) * 0.5;
      const mz = (f0.z + f1.z) * 0.5;
      const sep = Math.hypot(f1.x - f0.x, f1.z - f0.z);

      if (isWalkout) {
        const t = Math.max(0, Math.min(1, 1 - state.phaseTimer / 3.4));
        _camDesired.set(
          THREE.MathUtils.lerp(-3.4, mx, t),
          THREE.MathUtils.lerp(1.9, 2.35, t),
          THREE.MathUtils.lerp(4.2, 4.7, t),
        );
        _targetDesired.set(mx, 1.15, mz);
      } else {
        const camDist = THREE.MathUtils.clamp(3.3 + sep * 0.72, 3.6, 5.8);
        const isGround =
          f0.posture === 'ground_top' ||
          f0.posture === 'ground_bottom' ||
          f1.posture === 'ground_top' ||
          f1.posture === 'ground_bottom';

        const camHeight = isGround ? 1.85 : 2.15 + sep * 0.14;
        // Perpendicular offset to fighter line so we see profile action clearly
        const dx = f1.x - f0.x;
        const dz = f1.z - f0.z;
        const len = Math.hypot(dx, dz) || 1;
        // Choose side facing +Z preferentially so controls stay intuitive
        let px = -dz / len;
        let pz = dx / len;
        if (pz < 0) {
          px = -px;
          pz = -pz;
        }

        let desiredX = mx + px * camDist;
        let desiredZ = mz + pz * camDist;

        // Clamp camera inside octagon safe radius so cage posts never block view
        const camR = Math.hypot(desiredX, desiredZ);
        const maxCamR = OCTAGON_RADIUS - 0.55;
        if (camR > maxCamR) {
          desiredX = (desiredX / camR) * maxCamR;
          desiredZ = (desiredZ / camR) * maxCamR;
        }

        _camDesired.set(desiredX, camHeight, desiredZ);
        _targetDesired.set(mx, isGround ? 0.55 : 1.08, mz);
      }

      if (this.shakeTimer > 0) {
        this.shakeTimer = Math.max(0, this.shakeTimer - dt);
        const mag = this.shakeIntensity * (this.shakeTimer / 0.25);
        _camDesired.x += (Math.random() - 0.5) * mag;
        _camDesired.y += (Math.random() - 0.5) * mag;
      }

      this.camera.position.lerp(_camDesired, 1 - Math.exp(-5.8 * dt));
      _camLookCurrent.lerp(_targetDesired, 1 - Math.exp(-7.5 * dt));
      this.camera.lookAt(_camLookCurrent);
    }

    // Update impact particles
    for (const p of this.particles) {
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 9.5 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y = Math.max(0.02, p.mesh.position.y + p.vy * dt);
        p.mesh.position.z += p.vz * dt;
        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) {
          p.mesh.visible = false;
        }
      }
    }

    // Animate crowd cheering subtly (decay excitement)
    this.crowdExcitement = Math.max(0.18, this.crowdExcitement - dt * 0.22);
    if (this.crowdMesh && this.quality !== 'low') {
      const visibleCount = this.crowdMesh.count;
      const amp = 0.04 + this.crowdExcitement * 0.14;
      const speed = 3.2 + this.crowdExcitement * 5.0;
      for (let i = 0; i < visibleCount; i++) {
        const c = this.crowdBaseTransforms[i];
        _dummy.position.set(
          c.x,
          c.y + Math.abs(Math.sin(elapsed * speed + c.phase)) * amp,
          c.z,
        );
        _dummy.rotation.set(0, c.ry, 0);
        _dummy.scale.setScalar(c.scale);
        _dummy.updateMatrix();
        this.crowdMesh.setMatrixAt(i, _dummy.matrix);
      }
      this.crowdMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public getCameraYaw(): number {
    return Math.atan2(
      _camLookCurrent.x - this.camera.position.x,
      _camLookCurrent.z - this.camera.position.z,
    );
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = Math.max(
      1,
      this.container.clientWidth ||
        window.visualViewport?.width ||
        window.innerWidth,
    );
    const height = Math.max(
      1,
      this.container.clientHeight ||
        window.visualViewport?.height ||
        window.innerHeight,
    );
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);

    this.fighterRigs.forEach((r) => r.disposables.forEach((d) => d.dispose()));
    this.refereeRig.disposables.forEach((d) => d.dispose());
    this.disposables.forEach((d) => d.dispose());

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
