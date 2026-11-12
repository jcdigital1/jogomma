import * as THREE from 'three';
import { FIGHTER_PROFILES, MOVES } from '../shared/combatEngine.ts';
import { FighterId, FighterState } from '../shared/types.ts';
import {
  createContactShadowTexture,
  createShinTattooTexture,
  createShortsTexture,
  createTattooSleeveTexture,
  createTorsoTattooTexture,
} from './textures.ts';

export interface FighterRig {
  id: FighterId;
  root: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  head: THREE.Group;
  lShoulder: THREE.Group;
  lElbow: THREE.Group;
  rShoulder: THREE.Group;
  rElbow: THREE.Group;
  lHip: THREE.Group;
  lKnee: THREE.Group;
  lAnkle: THREE.Group;
  rHip: THREE.Group;
  rKnee: THREE.Group;
  rAnkle: THREE.Group;
  contactShadow: THREE.Mesh;
  hitFlashTimer: number;
  skinMaterial: THREE.MeshPhysicalMaterial;
  disposables: Array<{ dispose: () => void }>;
}

export interface RefereeRig {
  root: THREE.Group;
  hips: THREE.Group;
  chest: THREE.Group;
  head: THREE.Group;
  lShoulder: THREE.Group;
  lElbow: THREE.Group;
  rShoulder: THREE.Group;
  rElbow: THREE.Group;
  lHip: THREE.Group;
  lKnee: THREE.Group;
  rHip: THREE.Group;
  rKnee: THREE.Group;
  x: number;
  z: number;
  facing: number;
  disposables: Array<{ dispose: () => void }>;
}

function makeCapsule(
  rTop: number,
  rBot: number,
  len: number,
  mat: THREE.Material,
  disposables: Array<{ dispose: () => void }>,
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rTop, rBot, len, 16, 1);
  disposables.push(geo);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function makeSphere(
  r: number,
  mat: THREE.Material,
  disposables: Array<{ dispose: () => void }>,
  sx = 1,
  sy = 1,
  sz = 1,
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(r, 16, 14);
  disposables.push(geo);
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createFighterRig(id: FighterId): FighterRig {
  const profile = FIGHTER_PROFILES[id];
  const disposables: Array<{ dispose: () => void }> = [];
  const skinColorStr = '#' + profile.skinHex.toString(16).padStart(6, '0');
  const accentStr = '#' + profile.shortsAccentHex.toString(16).padStart(6, '0');

  const torsoTex = createTorsoTattooTexture(skinColorStr, id);
  const leftSleeveTex = createTattooSleeveTexture(
    skinColorStr,
    id === 'jean' ? 'jean_left' : 'charles_left',
  );
  const rightArmTex = createTattooSleeveTexture(
    skinColorStr,
    id === 'jean' ? 'jean_right' : 'charles_right',
  );
  const leftShinTex = createShinTattooTexture(skinColorStr, id, true);
  const rightShinTex = createShinTattooTexture(skinColorStr, id, false);
  const shortsTex = createShortsTexture(accentStr);
  const shadowTex = createContactShadowTexture();

  disposables.push(
    torsoTex,
    leftSleeveTex,
    rightArmTex,
    leftShinTex,
    rightShinTex,
    shortsTex,
    shadowTex,
  );

  // Subtle sweat sheen on fighter skin under arena spotlights
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: profile.skinHex,
    roughness: 0.46,
    metalness: 0.03,
    clearcoat: 0.24,
    clearcoatRoughness: 0.34,
  });
  const torsoMat = new THREE.MeshPhysicalMaterial({
    map: torsoTex,
    roughness: 0.45,
    metalness: 0.03,
    clearcoat: 0.28,
    clearcoatRoughness: 0.3,
  });
  const leftArmMat = new THREE.MeshPhysicalMaterial({
    map: leftSleeveTex,
    roughness: 0.48,
    metalness: 0.03,
    clearcoat: 0.22,
    clearcoatRoughness: 0.35,
  });
  const rightArmMat = new THREE.MeshPhysicalMaterial({
    map: rightArmTex,
    roughness: 0.48,
    metalness: 0.03,
    clearcoat: 0.22,
    clearcoatRoughness: 0.35,
  });
  const leftShinMat = new THREE.MeshPhysicalMaterial({
    map: leftShinTex,
    roughness: 0.48,
    metalness: 0.03,
    clearcoat: 0.2,
    clearcoatRoughness: 0.36,
  });
  const rightShinMat = new THREE.MeshPhysicalMaterial({
    map: rightShinTex,
    roughness: 0.48,
    metalness: 0.03,
    clearcoat: 0.2,
    clearcoatRoughness: 0.36,
  });

  const shortsMat = new THREE.MeshStandardMaterial({
    map: shortsTex,
    roughness: 0.68,
    metalness: 0.08,
  });
  // Black leather MMA gloves with red/blue wrist strap (matches uploaded photos)
  const gloveLeatherMat = new THREE.MeshPhysicalMaterial({
    color: 0x151820,
    roughness: 0.28,
    metalness: 0.14,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  });
  const wristCuffMat = new THREE.MeshStandardMaterial({
    color: profile.gloveHex,
    roughness: 0.36,
    metalness: 0.12,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.4,
    metalness: 0.05,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: profile.hairHex,
    roughness: 0.78,
    metalness: 0.04,
  });
  const darkFeatureMat = new THREE.MeshStandardMaterial({
    color: 0x181514,
    roughness: 0.45,
    metalness: 0.1,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f6,
    roughness: 0.22,
    metalness: 0.05,
  });

  disposables.push(
    skinMat,
    torsoMat,
    leftArmMat,
    rightArmMat,
    leftShinMat,
    rightShinMat,
    shortsMat,
    gloveLeatherMat,
    wristCuffMat,
    whiteTrimMat,
    hairMat,
    darkFeatureMat,
    eyeWhiteMat,
  );

  const root = new THREE.Group();
  root.scale.setScalar(profile.heightScale);

  const shadowGeo = new THREE.PlaneGeometry(1.22, 1.22);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.62,
  });
  disposables.push(shadowGeo, shadowMat);
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.016;
  root.add(contactShadow);

  const bw = profile.buildWidth;

  // Hips / Pelvis
  const hips = new THREE.Group();
  hips.position.set(0, 0.92, 0);
  root.add(hips);

  const pelvisMesh = makeCapsule(0.156 * bw, 0.168 * bw, 0.2, shortsMat, disposables);
  pelvisMesh.scale.set(1.08, 1, 0.78);
  hips.add(pelvisMesh);

  // Spine & Sculpted Abdomen (6-pack relief)
  const spine = new THREE.Group();
  spine.position.set(0, 0.09, 0);
  hips.add(spine);

  const abdomenMesh = makeCapsule(0.158 * bw, 0.146 * bw, 0.22, torsoMat, disposables);
  abdomenMesh.position.y = 0.11;
  abdomenMesh.scale.set(1.04, 1, 0.76);
  spine.add(abdomenMesh);

  for (let row = 0; row < 3; row++) {
    const abL = makeSphere(0.032 * bw, skinMat, disposables, 1.05, 0.78, 0.6);
    abL.position.set(0.034 * bw, 0.065 + row * 0.052, 0.105);
    const abR = abL.clone();
    abR.position.x = -0.034 * bw;
    spine.add(abL, abR);
  }

  // Chest & Sculpted Pectorals
  const chest = new THREE.Group();
  chest.position.set(0, 0.21, 0);
  spine.add(chest);

  const chestMesh = makeCapsule(0.2 * bw, 0.156 * bw, 0.27, torsoMat, disposables);
  chestMesh.position.y = 0.135;
  chestMesh.scale.set(1.18, 1, 0.76);
  chest.add(chestMesh);

  const pecL = makeSphere(0.072 * bw, torsoMat, disposables, 1.15, 0.85, 0.65);
  pecL.position.set(0.065 * bw, 0.17, 0.095);
  const pecR = pecL.clone();
  pecR.position.x = -0.065 * bw;
  chest.add(pecL, pecR);

  // Neck & Head
  const head = new THREE.Group();
  head.position.set(0, 0.3, 0.01);
  chest.add(head);

  const neckMesh = makeCapsule(0.056, 0.066, 0.12, skinMat, disposables);
  neckMesh.position.y = 0.045;
  head.add(neckMesh);

  const cranium = makeSphere(0.112, skinMat, disposables, 0.9, 1.08, 0.98);
  cranium.position.y = 0.172;
  head.add(cranium);

  const jaw = makeCapsule(0.088, 0.068, 0.09, skinMat, disposables);
  jaw.position.set(0, 0.11, 0.024);
  jaw.scale.set(0.92, 1, 0.95);
  head.add(jaw);

  // Nose
  const noseGeo = new THREE.ConeGeometry(0.016, 0.044, 8);
  disposables.push(noseGeo);
  const nose = new THREE.Mesh(noseGeo, skinMat);
  nose.rotation.x = Math.PI * 0.42;
  nose.position.set(0, 0.166, 0.113);
  head.add(nose);

  // Ears (slightly more prominent for Charles as in photo)
  const earScale = id === 'charles' ? 1.22 : 1.0;
  const earL = makeSphere(0.023 * earScale, skinMat, disposables, 0.45, 1.15, 0.75);
  earL.position.set(0.104, 0.168, -0.005);
  const earR = earL.clone();
  earR.position.x = -0.104;
  head.add(earL, earR);

  // Eyes & Brows
  const eyeL = makeSphere(0.014, eyeWhiteMat, disposables, 1.1, 0.85, 0.6);
  eyeL.position.set(0.036, 0.185, 0.098);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.036;
  const pupilL = makeSphere(0.0085, darkFeatureMat, disposables);
  pupilL.position.set(0.036, 0.185, 0.105);
  const pupilR = pupilL.clone();
  pupilR.position.x = -0.036;
  head.add(eyeL, eyeR, pupilL, pupilR);

  const browGeo = new THREE.BoxGeometry(0.036, 0.01, 0.014);
  disposables.push(browGeo);
  const browMat = id === 'jean' ? hairMat : darkFeatureMat;
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.position.set(0.036, 0.205, 0.098);
  browL.rotation.z = -0.08;
  const browR = browL.clone();
  browR.position.x = -0.036;
  browR.rotation.z = 0.08;
  head.add(browL, browR);

  if (id === 'jean') {
    // JEAN: Crisp buzz fade, full thick shaped beard + mustache, wire-frame round glasses
    const hairTop = makeSphere(0.113, hairMat, disposables, 0.92, 0.66, 1.0);
    hairTop.position.set(0, 0.238, -0.006);
    const hairBack = makeCapsule(0.096, 0.082, 0.095, hairMat, disposables);
    hairBack.position.set(0, 0.19, -0.042);
    hairBack.rotation.x = 0.2;
    head.add(hairTop, hairBack);

    // Full thick dark beard & mustache matching uploaded portrait
    const beard = makeCapsule(0.093, 0.072, 0.09, hairMat, disposables);
    beard.position.set(0, 0.102, 0.028);
    beard.scale.set(0.96, 1.04, 1.0);
    const chinBeard = makeSphere(0.056, hairMat, disposables, 0.95, 1.15, 0.9);
    chinBeard.position.set(0, 0.078, 0.055);
    const stache = makeCapsule(0.012, 0.012, 0.068, hairMat, disposables);
    stache.rotation.z = Math.PI / 2;
    stache.position.set(0, 0.135, 0.098);
    head.add(beard, chinBeard, stache);

    // Round/Oval Thin Wire-Frame Glasses
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2e38,
      roughness: 0.2,
      metalness: 0.9,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.06,
      metalness: 0.08,
      transparent: true,
      opacity: 0.24,
      clearcoat: 1.0,
    });
    disposables.push(frameMat, lensMat);

    const rimGeo = new THREE.TorusGeometry(0.025, 0.0032, 8, 24);
    const lensGeo = new THREE.CircleGeometry(0.0235, 20);
    const bridgeGeo = new THREE.BoxGeometry(0.024, 0.0035, 0.0035);
    const templeGeo = new THREE.BoxGeometry(0.0035, 0.0035, 0.105);
    disposables.push(rimGeo, lensGeo, bridgeGeo, templeGeo);

    const rimL = new THREE.Mesh(rimGeo, frameMat);
    rimL.position.set(0.037, 0.184, 0.115);
    const rimR = rimL.clone();
    rimR.position.x = -0.037;

    const lensL = new THREE.Mesh(lensGeo, lensMat);
    lensL.position.set(0.037, 0.184, 0.115);
    const lensR = lensL.clone();
    lensR.position.x = -0.037;

    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.position.set(0, 0.188, 0.116);

    const templeL = new THREE.Mesh(templeGeo, frameMat);
    templeL.position.set(0.062, 0.186, 0.065);
    const templeR = templeL.clone();
    templeR.position.x = -0.062;

    head.add(rimL, rimR, lensL, lensR, bridge, templeL, templeR);
  } else {
    // CHARLES DO BRONX: Short cropped dark hair + subtle stubble (matching uploaded photo)
    const hairTop = makeSphere(0.112, hairMat, disposables, 0.91, 0.65, 0.98);
    hairTop.position.set(0, 0.24, -0.008);
    const hairBack = makeCapsule(0.095, 0.08, 0.09, hairMat, disposables);
    hairBack.position.set(0, 0.19, -0.044);
    hairBack.rotation.x = 0.22;
    head.add(hairTop, hairBack);

    const stubble = makeCapsule(0.089, 0.069, 0.075, darkFeatureMat, disposables);
    stubble.position.set(0, 0.104, 0.025);
    stubble.scale.set(0.92, 1, 0.95);
    head.add(stubble);
  }

  // Arms builder (local +X = LEFT, -X = RIGHT)
  function buildArm(isLeft: boolean) {
    const mat = isLeft ? leftArmMat : rightArmMat;
    const shoulder = new THREE.Group();
    shoulder.position.set(isLeft ? 0.225 * bw : -0.225 * bw, 0.24, 0);
    chest.add(shoulder);

    const delt = makeSphere(0.066 * bw, mat, disposables, 1.08, 1.04, 0.96);
    shoulder.add(delt);

    const upperArm = makeCapsule(0.054 * bw, 0.046 * bw, 0.28, mat, disposables);
    upperArm.position.y = -0.14;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.28, 0);
    shoulder.add(elbow);

    const elbowJoint = makeSphere(0.044 * bw, mat, disposables);
    elbow.add(elbowJoint);

    const forearm = makeCapsule(0.046 * bw, 0.035 * bw, 0.25, mat, disposables);
    forearm.position.y = -0.125;
    elbow.add(forearm);

    // Colored Wrist Cuff Strap (Red for Jean, Blue for Charles) matching photos
    const wristStrap = makeCapsule(0.041, 0.041, 0.062, wristCuffMat, disposables);
    wristStrap.position.y = -0.245;
    elbow.add(wristStrap);

    // Black Leather MMA Open-Finger Glove + white knuckle accent
    const glove = makeSphere(0.059, gloveLeatherMat, disposables, 0.96, 1.15, 1.1);
    glove.position.set(0, -0.305, 0.012);
    elbow.add(glove);

    const knucklePad = makeSphere(0.046, gloveLeatherMat, disposables, 1.12, 0.72, 0.92);
    knucklePad.position.set(0, -0.34, 0.036);
    elbow.add(knucklePad);

    const brandStripeGeo = new THREE.BoxGeometry(0.042, 0.016, 0.012);
    disposables.push(brandStripeGeo);
    const brandStripe = new THREE.Mesh(brandStripeGeo, whiteTrimMat);
    brandStripe.position.set(0, -0.3, 0.064);
    elbow.add(brandStripe);

    return { shoulder, elbow };
  }

  const leftArm = buildArm(true);
  const rightArm = buildArm(false);

  // Legs builder (Shorts + tattooed shins + barefoot)
  function buildLeg(isLeft: boolean) {
    const shinMat = isLeft ? leftShinMat : rightShinMat;
    const hip = new THREE.Group();
    hip.position.set(isLeft ? 0.106 * bw : -0.106 * bw, -0.06, 0);
    hips.add(hip);

    const shortLeg = makeCapsule(0.09 * bw, 0.084 * bw, 0.24, shortsMat, disposables);
    shortLeg.position.y = -0.12;
    hip.add(shortLeg);

    const lowerThigh = makeCapsule(0.074 * bw, 0.059 * bw, 0.22, skinMat, disposables);
    lowerThigh.position.y = -0.28;
    hip.add(lowerThigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.4, 0);
    hip.add(knee);

    const kneeCap = makeSphere(0.057 * bw, skinMat, disposables);
    knee.add(kneeCap);

    const shin = makeCapsule(0.057 * bw, 0.039 * bw, 0.39, shinMat, disposables);
    shin.position.y = -0.195;
    knee.add(shin);

    const ankle = new THREE.Group();
    ankle.position.set(0, -0.4, 0);
    knee.add(ankle);

    // Barefoot anatomical foot
    const heel = makeSphere(0.039, skinMat, disposables, 0.95, 0.8, 1.25);
    heel.position.set(0, -0.025, 0.01);
    const forefoot = makeCapsule(0.041, 0.037, 0.135, skinMat, disposables);
    forefoot.rotation.x = Math.PI / 2;
    forefoot.scale.set(1.06, 1, 0.56);
    forefoot.position.set(0, -0.036, 0.08);
    ankle.add(heel, forefoot);

    return { hip, knee, ankle };
  }

  const leftLeg = buildLeg(true);
  const rightLeg = buildLeg(false);

  return {
    id,
    root,
    hips,
    spine,
    chest,
    head,
    lShoulder: leftArm.shoulder,
    lElbow: leftArm.elbow,
    rShoulder: rightArm.shoulder,
    rElbow: rightArm.elbow,
    lHip: leftLeg.hip,
    lKnee: leftLeg.knee,
    lAnkle: leftLeg.ankle,
    rHip: rightLeg.hip,
    rKnee: rightLeg.knee,
    rAnkle: rightLeg.ankle,
    contactShadow,
    hitFlashTimer: 0,
    skinMaterial: skinMat,
    disposables,
  };
}

export function createRefereeRig(): RefereeRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0x1b1e25,
    roughness: 0.72,
    metalness: 0.06,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x0f1116,
    roughness: 0.8,
    metalness: 0.04,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xb98260,
    roughness: 0.58,
    metalness: 0.03,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x090a0d,
    roughness: 0.5,
    metalness: 0.12,
  });
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(1.05, 1.05);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.45,
  });

  disposables.push(
    shirtMat,
    pantsMat,
    skinMat,
    shoeMat,
    shadowTex,
    shadowGeo,
    shadowMat,
  );

  const root = new THREE.Group();
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.014;
  root.add(shadow);

  const hips = new THREE.Group();
  hips.position.set(0, 0.92, 0);
  root.add(hips);

  const pelvis = makeCapsule(0.16, 0.16, 0.18, pantsMat, disposables);
  hips.add(pelvis);

  const chest = new THREE.Group();
  chest.position.set(0, 0.25, 0);
  hips.add(chest);

  const torso = makeCapsule(0.19, 0.16, 0.42, shirtMat, disposables);
  torso.position.y = 0.05;
  torso.scale.set(1.12, 1, 0.78);
  chest.add(torso);

  const head = new THREE.Group();
  head.position.set(0, 0.34, 0);
  chest.add(head);

  const cranium = makeSphere(0.108, skinMat, disposables, 0.92, 1.06, 0.96);
  cranium.position.y = 0.12;
  head.add(cranium);

  function arm(isLeft: boolean) {
    const sh = new THREE.Group();
    sh.position.set(isLeft ? 0.22 : -0.22, 0.22, 0);
    chest.add(sh);
    const up = makeCapsule(0.05, 0.045, 0.27, shirtMat, disposables);
    up.position.y = -0.13;
    sh.add(up);
    const el = new THREE.Group();
    el.position.set(0, -0.26, 0);
    sh.add(el);
    const lo = makeCapsule(0.04, 0.032, 0.26, skinMat, disposables);
    lo.position.y = -0.13;
    el.add(lo);
    return { sh, el };
  }

  const la = arm(true);
  const ra = arm(false);

  function leg(isLeft: boolean) {
    const hp = new THREE.Group();
    hp.position.set(isLeft ? 0.1 : -0.1, -0.05, 0);
    hips.add(hp);
    const th = makeCapsule(0.08, 0.06, 0.4, pantsMat, disposables);
    th.position.y = -0.2;
    hp.add(th);
    const kn = new THREE.Group();
    kn.position.set(0, -0.4, 0);
    hp.add(kn);
    const sh = makeCapsule(0.06, 0.048, 0.4, pantsMat, disposables);
    sh.position.y = -0.2;
    const shoe = makeSphere(0.05, shoeMat, disposables, 0.95, 0.7, 1.6);
    shoe.position.set(0, -0.42, 0.04);
    kn.add(sh, shoe);
    return { hp, kn };
  }

  const ll = leg(true);
  const rl = leg(false);

  return {
    root,
    hips,
    chest,
    head,
    lShoulder: la.sh,
    lElbow: la.el,
    rShoulder: ra.sh,
    rElbow: ra.el,
    lHip: ll.hp,
    lKnee: ll.kn,
    rHip: rl.hp,
    rKnee: rl.kn,
    x: 0,
    z: -3.1,
    facing: 0,
    disposables,
  };
}

interface PoseTargets {
  hipsY: number;
  hipsRx: number;
  hipsRy: number;
  hipsRz: number;
  spineRx: number;
  spineRy: number;
  spineRz: number;
  chestRx: number;
  chestRy: number;
  headRx: number;
  headRy: number;
  headRz: number;
  lShX: number;
  lShY: number;
  lShZ: number;
  lElX: number;
  rShX: number;
  rShY: number;
  rShZ: number;
  rElX: number;
  lHipX: number;
  lHipZ: number;
  lKneeX: number;
  rHipX: number;
  rHipZ: number;
  rKneeX: number;
}

const DEFAULT_POSE: PoseTargets = {
  hipsY: 0.9,
  hipsRx: 0.04,
  hipsRy: -0.22,
  hipsRz: 0,
  spineRx: 0.08,
  spineRy: 0.1,
  spineRz: 0,
  chestRx: 0.06,
  chestRy: 0.12,
  headRx: -0.08,
  headRy: 0,
  headRz: 0,
  // Orthodox MMA guard: Lead left arm forward, rear right arm tucked by jaw
  lShX: -0.92,
  lShY: 0.15,
  lShZ: 0.24,
  lElX: -1.42,
  rShX: -0.98,
  rShY: -0.18,
  rShZ: -0.22,
  rElX: -1.68,
  // Athletic stance legs
  lHipX: -0.32,
  lHipZ: 0.14,
  lKneeX: 0.42,
  rHipX: 0.24,
  rHipZ: -0.16,
  rKneeX: 0.36,
};

function dampVal(cur: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(cur, target, lambda, dt);
}

export function updateFighterRig(
  rig: FighterRig,
  f: FighterState,
  elapsed: number,
  dt: number,
  isWalkout: boolean,
): void {
  // Position & orientation (Combat engine facing 0 = +X, while rig faces +Z by default)
  rig.root.position.set(f.x, 0, f.z);
  const targetRotY = Math.PI / 2 - f.facing;
  // Shortest angular damp
  let diff = targetRotY - rig.root.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  rig.root.rotation.y += diff * Math.min(1, dt * 16);

  // Subtle hit flash tint on skin
  if (rig.hitFlashTimer > 0) {
    rig.hitFlashTimer = Math.max(0, rig.hitFlashTimer - dt);
    rig.skinMaterial.emissive.setHex(0x661111);
    rig.skinMaterial.emissiveIntensity = rig.hitFlashTimer * 4.0;
  } else if (f.rockedTimer > 0) {
    rig.skinMaterial.emissive.setHex(0x330808);
    rig.skinMaterial.emissiveIntensity = 0.2 + 0.15 * Math.sin(elapsed * 16);
  } else {
    rig.skinMaterial.emissive.setHex(0x000000);
    rig.skinMaterial.emissiveIntensity = 0;
  }

  const p: PoseTargets = { ...DEFAULT_POSE };
  let dampRate = 16;

  const speed = Math.hypot(f.vx, f.vz);
  const bounce = Math.sin(elapsed * 5.2 + f.slot * 1.4);

  if (isWalkout) {
    // Fighter entrance: pumping fists / bouncing in corner
    p.hipsY = 0.91 + Math.abs(Math.sin(elapsed * 4.2)) * 0.03;
    p.lShX = -1.6 + Math.sin(elapsed * 4.2) * 0.25;
    p.rShX = -1.7 + Math.cos(elapsed * 4.2) * 0.25;
    p.lElX = -1.1;
    p.rElX = -1.1;
    p.chestRx = -0.05;
    dampRate = 10;
  } else if (f.posture === 'victory') {
    p.hipsY = 0.92;
    p.hipsRy = 0;
    p.lShX = -2.65;
    p.lShZ = 0.45;
    p.lElX = -0.35;
    p.rShX = -2.65;
    p.rShZ = -0.45;
    p.rElX = -0.35;
    p.headRx = -0.2;
    p.lHipX = -0.1;
    p.rHipX = 0.1;
    p.lKneeX = 0.15;
    p.rKneeX = 0.15;
    dampRate = 8;
  } else if (f.posture === 'ko') {
    // Flat on the octagon mat
    p.hipsY = 0.16;
    p.hipsRx = -Math.PI / 2 + 0.08;
    p.hipsRy = 0.2;
    p.spineRx = 0.12;
    p.headRx = 0.2;
    p.headRy = 0.45;
    p.lShX = -0.3;
    p.lShZ = 0.85;
    p.lElX = -0.4;
    p.rShX = -0.2;
    p.rShZ = -0.7;
    p.rElX = -0.6;
    p.lHipX = 0.15;
    p.lKneeX = 0.22;
    p.rHipX = -0.1;
    p.rKneeX = 0.35;
    dampRate = 11;
  } else if (f.posture === 'knockdown') {
    p.hipsY = 0.34;
    p.hipsRx = -0.95;
    p.spineRx = 0.25;
    p.lShX = -0.8;
    p.rShX = -1.2;
    p.lElX = -1.1;
    p.rElX = -1.4;
    p.lHipX = -0.7;
    p.lKneeX = 1.25;
    p.rHipX = -0.4;
    p.rKneeX = 0.85;
    dampRate = 12;
  } else if (f.posture === 'ground_top') {
    p.hipsY = 0.46;
    p.hipsRx = 0.55;
    p.hipsRy = 0;
    p.spineRx = 0.38;
    p.lHipX = -1.05;
    p.lHipZ = 0.42;
    p.lKneeX = 1.65;
    p.rHipX = -1.05;
    p.rHipZ = -0.42;
    p.rKneeX = 1.65;
    if (f.activeMove === 'gnp_strike') {
      const def = MOVES.gnp_strike;
      const t = Math.min(1, f.moveTimer / (def.startup + def.active));
      const strikeCycle = Math.sin(t * Math.PI);
      p.rShX = -1.65 + strikeCycle * 0.9;
      p.rElX = -0.35 - (1 - strikeCycle) * 1.1;
      p.spineRx = 0.45 + strikeCycle * 0.28;
      dampRate = 26;
    } else if (f.activeMove === 'submission_attempt') {
      p.hipsY = 0.32;
      p.hipsRx = -0.45;
      p.spineRx = 0.35;
      p.lShX = -1.35;
      p.rShX = -1.35;
      p.lElX = -1.45;
      p.rElX = -1.45;
      dampRate = 12;
    } else {
      p.lShX = -1.1;
      p.rShX = -1.1;
      p.lElX = -1.1;
      p.rElX = -1.1;
      dampRate = 12;
    }
  } else if (f.posture === 'ground_bottom') {
    p.hipsY = 0.2;
    p.hipsRx = -1.35;
    p.hipsRy = 0;
    p.spineRx = 0.32;
    p.headRx = 0.25;
    p.lHipX = -0.85;
    p.lHipZ = 0.42;
    p.lKneeX = 1.45;
    p.rHipX = -0.85;
    p.rHipZ = -0.42;
    p.rKneeX = 1.45;
    p.lShX = -1.3;
    p.rShX = -1.3;
    p.lElX = -1.7;
    p.rElX = -1.7;
    dampRate = 12;
  } else if (f.posture === 'clinch') {
    p.hipsY = 0.88;
    p.hipsRy = 0;
    p.spineRx = 0.14;
    p.lShX = -1.45;
    p.lShZ = -0.15;
    p.lElX = -1.15;
    p.rShX = -1.45;
    p.rShZ = 0.15;
    p.rElX = -1.15;
    if (f.activeMove === 'knee') {
      const t = Math.min(1, f.moveTimer / 0.26);
      const s = Math.sin(t * Math.PI);
      p.rHipX = -1.45 * s;
      p.rKneeX = 1.9 * s;
      p.spineRx = 0.1 - 0.2 * s;
      dampRate = 24;
    } else if (f.activeMove === 'elbow') {
      const t = Math.min(1, f.moveTimer / 0.25);
      const s = Math.sin(t * Math.PI);
      p.rShX = -1.55;
      p.rShY = 0.9 * s;
      p.rElX = -2.1;
      p.chestRy = 0.5 * s;
      dampRate = 26;
    }
  } else if (f.activeMove !== 'none') {
    // Active Standing Moves
    const def = MOVES[f.activeMove];
    const peakTime = def.startup + def.active * 0.5;
    const total = def.startup + def.active + def.recovery;
    let ext = 0;
    if (f.moveTimer <= peakTime) {
      ext = Math.sin((f.moveTimer / Math.max(0.01, peakTime)) * (Math.PI / 2));
    } else {
      ext = Math.cos(
        ((f.moveTimer - peakTime) / Math.max(0.01, total - peakTime)) *
          (Math.PI / 2),
      );
    }
    ext = Math.max(0, Math.min(1, ext));
    dampRate = 28;

    switch (f.activeMove) {
      case 'jab':
        p.hipsRy = -0.1 + ext * 0.28;
        p.chestRy = ext * 0.36;
        p.lShX = -0.92 - ext * 0.65;
        p.lShZ = 0.24 - ext * 0.28;
        p.lElX = -1.42 + ext * 1.32;
        break;
      case 'cross':
        p.hipsRy = -0.22 - ext * 0.42;
        p.chestRy = -ext * 0.52;
        p.spineRx = 0.1 + ext * 0.14;
        p.rShX = -0.98 - ext * 0.62;
        p.rShZ = -0.22 + ext * 0.26;
        p.rElX = -1.68 + ext * 1.56;
        break;
      case 'hook':
        p.hipsRy = -0.22 + ext * 0.62;
        p.chestRy = ext * 0.68;
        p.lShX = -1.45;
        p.lShY = -0.6 + ext * 1.45;
        p.lShZ = 0.9 - ext * 0.55;
        p.lElX = -1.35;
        break;
      case 'uppercut':
        p.hipsY = 0.9 - (1 - ext) * 0.1 + ext * 0.06;
        p.spineRx = 0.2 - ext * 0.35;
        p.chestRy = -ext * 0.4;
        p.rShX = -0.35 - ext * 1.65;
        p.rElX = -1.55 + ext * 0.25;
        break;
      case 'overhand':
        p.hipsRy = -0.2 - ext * 0.58;
        p.spineRx = 0.15 + ext * 0.32;
        p.chestRy = -ext * 0.6;
        p.rShX = -2.2 + ext * 0.75;
        p.rShZ = -0.55 + ext * 0.7;
        p.rElX = -1.2 + ext * 0.6;
        break;
      case 'elbow':
        p.hipsRy = -0.15 - ext * 0.65;
        p.chestRy = -ext * 0.7;
        p.rShX = -1.5;
        p.rShY = -0.5 + ext * 1.35;
        p.rShZ = -0.7 + ext * 0.5;
        p.rElX = -2.2;
        break;
      case 'low_kick':
        p.hipsY = 0.88;
        p.hipsRy = -0.2 + ext * 0.65;
        p.hipsRz = -ext * 0.22;
        p.rHipX = -0.75 * ext;
        p.rHipZ = -0.68 * ext;
        p.rKneeX = 0.45 * (1 - ext) + 0.12;
        p.rShX = -0.6 + ext * 0.5;
        break;
      case 'body_kick':
        p.hipsY = 0.9;
        p.hipsRy = -0.2 + ext * 0.82;
        p.hipsRz = -ext * 0.38;
        p.spineRz = ext * 0.22;
        p.rHipX = -1.15 * ext;
        p.rHipZ = -0.82 * ext;
        p.rKneeX = 0.15;
        p.rShX = -0.4 + ext * 0.65;
        break;
      case 'high_kick':
        p.hipsY = 0.92;
        p.hipsRy = -0.2 + ext * 0.95;
        p.hipsRz = -ext * 0.58;
        p.spineRz = ext * 0.35;
        p.rHipX = -1.48 * ext;
        p.rHipZ = -1.02 * ext;
        p.rKneeX = 0.08;
        p.rShX = -0.2 + ext * 0.8;
        p.lShX = -1.15;
        break;
      case 'front_kick':
        p.hipsY = 0.9;
        p.spineRx = -0.22 * ext;
        p.rHipX = -1.48 * ext;
        p.rKneeX = (1 - ext) * 1.3;
        break;
      case 'knee':
        p.hipsY = 0.92;
        p.spineRx = -0.15 * ext;
        p.rHipX = -1.62 * ext;
        p.rKneeX = 2.05 * ext;
        p.lShX = -1.25;
        p.rShX = -1.25;
        break;
      case 'dodge_left':
        p.hipsY = 0.84;
        p.spineRz = 0.48 * ext;
        p.headRx = 0.12;
        break;
      case 'dodge_right':
        p.hipsY = 0.84;
        p.spineRz = -0.48 * ext;
        p.headRx = 0.12;
        break;
      case 'dodge_back':
        p.hipsY = 0.86;
        p.spineRx = -0.34 * ext;
        p.headRx = 0.15;
        break;
      case 'takedown_attempt':
        p.hipsY = 0.58;
        p.spineRx = 0.72 * ext;
        p.lShX = -1.25;
        p.rShX = -1.25;
        p.lElX = -0.8;
        p.rElX = -0.8;
        p.lHipX = -0.85;
        p.lKneeX = 1.25;
        p.rHipX = 0.45;
        p.rKneeX = 0.65;
        break;
      case 'clinch_attempt':
        p.spineRx = 0.22 * ext;
        p.lShX = -1.45 * ext - 0.3;
        p.rShX = -1.45 * ext - 0.3;
        p.lElX = -0.8;
        p.rElX = -0.8;
        break;
      default:
        break;
    }
  } else if (f.stunTimer > 0) {
    // Hit reaction / stagger
    p.hipsY = 0.86;
    p.spineRx = f.lastHitZone === 'body' ? 0.36 : -0.26;
    p.headRx = f.lastHitZone === 'head' ? -0.38 : 0.1;
    p.headRy = f.slot === 0 ? 0.25 : -0.25;
    p.lShX = -0.5;
    p.rShX = -0.5;
    dampRate = 24;
  } else if (f.isBlocking) {
    // High vs Low Guard
    p.hipsY = f.blockZone === 'low' ? 0.82 : 0.88;
    p.spineRx = 0.18;
    p.headRx = 0.14;
    if (f.blockZone === 'high') {
      p.lShX = -1.35;
      p.lShZ = -0.18;
      p.lElX = -1.95;
      p.rShX = -1.35;
      p.rShZ = 0.18;
      p.rElX = -1.95;
    } else {
      // Body & leg check
      p.lShX = -0.85;
      p.lElX = -1.65;
      p.rShX = -0.85;
      p.rElX = -1.65;
      p.lHipX = -0.95;
      p.lKneeX = 1.35;
    }
    dampRate = 20;
  } else {
    // Standing Idle / Directional Footwork + Rocked wobble
    const stepCycle = elapsed * 8.5;
    const walkAmp = Math.min(1, speed / 2.6);
    p.hipsY = 0.89 + Math.abs(bounce) * 0.022 + (walkAmp * Math.abs(Math.sin(stepCycle)) * 0.025);
    p.lHipX = -0.32 + Math.sin(stepCycle) * 0.36 * walkAmp;
    p.rHipX = 0.24 - Math.sin(stepCycle) * 0.36 * walkAmp;
    p.lKneeX = 0.42 + Math.max(0, Math.sin(stepCycle + 0.6)) * 0.28 * walkAmp;
    p.rKneeX = 0.36 + Math.max(0, -Math.sin(stepCycle + 0.6)) * 0.28 * walkAmp;

    // Subtle guard sway
    p.lShX = -0.92 + bounce * 0.05;
    p.rShX = -0.98 - bounce * 0.05;

    if (f.rockedTimer > 0) {
      p.spineRz = Math.sin(elapsed * 9) * 0.18;
      p.headRz = Math.cos(elapsed * 9) * 0.14;
    }
    if (f.stamina < 20) {
      p.spineRx = 0.22;
      p.lShX = -0.65;
      p.rShX = -0.7;
    }
  }

  // Smooth exponential damping across all joints
  rig.hips.position.y = dampVal(rig.hips.position.y, p.hipsY, dampRate, dt);
  rig.hips.rotation.x = dampVal(rig.hips.rotation.x, p.hipsRx, dampRate, dt);
  rig.hips.rotation.y = dampVal(rig.hips.rotation.y, p.hipsRy, dampRate, dt);
  rig.hips.rotation.z = dampVal(rig.hips.rotation.z, p.hipsRz, dampRate, dt);

  rig.spine.rotation.x = dampVal(rig.spine.rotation.x, p.spineRx, dampRate, dt);
  rig.spine.rotation.y = dampVal(rig.spine.rotation.y, p.spineRy, dampRate, dt);
  rig.spine.rotation.z = dampVal(rig.spine.rotation.z, p.spineRz, dampRate, dt);

  rig.chest.rotation.x = dampVal(rig.chest.rotation.x, p.chestRx, dampRate, dt);
  rig.chest.rotation.y = dampVal(rig.chest.rotation.y, p.chestRy, dampRate, dt);

  rig.head.rotation.x = dampVal(rig.head.rotation.x, p.headRx, dampRate, dt);
  rig.head.rotation.y = dampVal(rig.head.rotation.y, p.headRy, dampRate, dt);
  rig.head.rotation.z = dampVal(rig.head.rotation.z, p.headRz, dampRate, dt);

  rig.lShoulder.rotation.x = dampVal(rig.lShoulder.rotation.x, p.lShX, dampRate, dt);
  rig.lShoulder.rotation.y = dampVal(rig.lShoulder.rotation.y, p.lShY, dampRate, dt);
  rig.lShoulder.rotation.z = dampVal(rig.lShoulder.rotation.z, p.lShZ, dampRate, dt);
  rig.lElbow.rotation.x = dampVal(rig.lElbow.rotation.x, p.lElX, dampRate, dt);

  rig.rShoulder.rotation.x = dampVal(rig.rShoulder.rotation.x, p.rShX, dampRate, dt);
  rig.rShoulder.rotation.y = dampVal(rig.rShoulder.rotation.y, p.rShY, dampRate, dt);
  rig.rShoulder.rotation.z = dampVal(rig.rShoulder.rotation.z, p.rShZ, dampRate, dt);
  rig.rElbow.rotation.x = dampVal(rig.rElbow.rotation.x, p.rElX, dampRate, dt);

  rig.lHip.rotation.x = dampVal(rig.lHip.rotation.x, p.lHipX, dampRate, dt);
  rig.lHip.rotation.z = dampVal(rig.lHip.rotation.z, p.lHipZ, dampRate, dt);
  rig.lKnee.rotation.x = dampVal(rig.lKnee.rotation.x, p.lKneeX, dampRate, dt);

  rig.rHip.rotation.x = dampVal(rig.rHip.rotation.x, p.rHipX, dampRate, dt);
  rig.rHip.rotation.z = dampVal(rig.rHip.rotation.z, p.rHipZ, dampRate, dt);
  rig.rKnee.rotation.x = dampVal(rig.rKnee.rotation.x, p.rKneeX, dampRate, dt);
}

export function updateRefereeRig(
  ref: RefereeRig,
  f0: FighterState,
  f1: FighterState,
  isFinished: boolean,
  elapsed: number,
  dt: number,
): void {
  const mx = (f0.x + f1.x) * 0.5;
  const mz = (f0.z + f1.z) * 0.5;

  // Referee orbits to the back side of the midpoint (opposite camera side +Z)
  let targetX = mx * 0.65;
  let targetZ = mz - 2.35;
  const r = Math.hypot(targetX, targetZ);
  if (r > 4.2) {
    targetX = (targetX / r) * 4.2;
    targetZ = (targetZ / r) * 4.2;
  }

  const prevX = ref.x;
  const prevZ = ref.z;
  ref.x = THREE.MathUtils.damp(ref.x, targetX, 3.8, dt);
  ref.z = THREE.MathUtils.damp(ref.z, targetZ, 3.8, dt);

  const speed = Math.hypot(ref.x - prevX, ref.z - prevZ) / Math.max(0.001, dt);
  ref.root.position.set(ref.x, 0, ref.z);

  const lookAngle = Math.atan2(mx - ref.x, mz - ref.z);
  let diff = lookAngle - ref.root.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  ref.root.rotation.y += diff * Math.min(1, dt * 8);

  const walk = Math.min(1, speed / 1.5);
  const step = Math.sin(elapsed * 7) * 0.35 * walk;
  ref.lHip.rotation.x = step;
  ref.rHip.rotation.x = -step;
  ref.lKnee.rotation.x = Math.max(0, -step) * 0.6 + 0.1;
  ref.rKnee.rotation.x = Math.max(0, step) * 0.6 + 0.1;

  if (isFinished) {
    // Wave hands off to stop the fight!
    const wave = Math.sin(elapsed * 12) * 0.6;
    ref.lShoulder.rotation.x = -1.6;
    ref.lShoulder.rotation.z = 0.5 + wave;
    ref.rShoulder.rotation.x = -1.6;
    ref.rShoulder.rotation.z = -0.5 - wave;
    ref.lElbow.rotation.x = -0.4;
    ref.rElbow.rotation.x = -0.4;
  } else {
    // Ready official stance
    ref.lShoulder.rotation.x = -0.45;
    ref.lShoulder.rotation.z = 0.12;
    ref.rShoulder.rotation.x = -0.45;
    ref.rShoulder.rotation.z = -0.12;
    ref.lElbow.rotation.x = -0.85;
    ref.rElbow.rotation.x = -0.85;
  }
}
