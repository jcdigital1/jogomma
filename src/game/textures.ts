import * as THREE from 'three';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createOctagonMatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1024, 1024);

  // Deep pro matte slate-charcoal canvas
  ctx.fillStyle = '#181c24';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle woven canvas texture & arena wear
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.028)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 1024; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Overhead spotlight radial gradient
  const rad = ctx.createRadialGradient(512, 512, 60, 512, 512, 510);
  rad.addColorStop(0, 'rgba(255,255,255,0.1)');
  rad.addColorStop(0.55, 'rgba(30,41,59,0.05)');
  rad.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.save();
  ctx.translate(512, 512);

  // Outer octagon ring lines
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const r = 432;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 325, 0, Math.PI * 2);
  ctx.stroke();

  // Red & Blue corner arcs
  ctx.strokeStyle = 'rgba(217, 30, 42, 0.72)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(0, 0, 305, Math.PI * 0.84, Math.PI * 1.16);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(29, 111, 235, 0.72)';
  ctx.beginPath();
  ctx.arc(0, 0, 305, -Math.PI * 0.16, Math.PI * 0.16);
  ctx.stroke();

  // Center JZN MMA crest
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 146, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(217, 30, 42, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 128, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(29, 111, 235, 0.55)';
  ctx.beginPath();
  ctx.arc(0, 0, 128, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  // Crisp Center Typography: JZN MMA
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = 'italic 800 72px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JZN', 0, -24);

  ctx.fillStyle = 'rgba(217, 30, 42, 0.48)';
  ctx.font = '800 38px "Barlow Condensed", sans-serif';
  ctx.fillText('MMA ARENA', 0, 32);

  // Secondary floor marks
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = '700 26px "Barlow Condensed", sans-serif';
  ctx.fillText('JZN MMA', 0, -245);
  ctx.fillText('JZN MMA', 0, 245);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMatRoughnessTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#d4d4d4';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(90,90,90,0.2)';
    ctx.fillRect(x, y, 6, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export function createArenaBannerTexture(
  label: string,
  accentColor: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 160);
  const grad = ctx.createLinearGradient(0, 0, 512, 160);
  grad.addColorStop(0, '#07090e');
  grad.addColorStop(0.5, '#111622');
  grad.addColorStop(1, '#07090e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 512, 8);
  ctx.fillRect(0, 152, 512, 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 800 76px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 82);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCageMeshTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);

  ctx.strokeStyle = '#191d24';
  ctx.lineWidth = 5;
  for (let offset = -128; offset <= 256; offset += 32) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + 128, 128);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(offset, 128);
    ctx.lineTo(offset + 128, 0);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(200, 214, 235, 0.42)';
  ctx.lineWidth = 1.6;
  for (let offset = -128; offset <= 256; offset += 32) {
    ctx.beginPath();
    ctx.moveTo(offset - 1, 0);
    ctx.lineTo(offset + 127, 128);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 7);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createTattooSleeveTexture(
  baseSkinHex: string,
  style: 'jean_left' | 'jean_right' | 'charles_right' | 'charles_left',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseSkinHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle anatomical shading
  const shade = ctx.createLinearGradient(0, 0, 512, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.09)');
  shade.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  shade.addColorStop(1, 'rgba(0,0,0,0.09)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(24, 30, 38, 0.78)';
  ctx.fillStyle = 'rgba(24, 30, 38, 0.62)';

  if (style === 'jean_left') {
    // Upper sleeve: Crown + Lion portrait motif + Forearm cross
    // Shading backdrop
    const inkWash = ctx.createLinearGradient(0, 30, 0, 480);
    inkWash.addColorStop(0, 'rgba(25, 32, 42, 0.45)');
    inkWash.addColorStop(0.6, 'rgba(25, 32, 42, 0.32)');
    inkWash.addColorStop(1, 'rgba(25, 32, 42, 0.25)');
    ctx.fillStyle = inkWash;
    ctx.fillRect(40, 28, 432, 440);

    // Crown on deltoid
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(150, 110);
    ctx.lineTo(175, 58);
    ctx.lineTo(220, 92);
    ctx.lineTo(256, 48);
    ctx.lineTo(292, 92);
    ctx.lineTo(337, 58);
    ctx.lineTo(362, 110);
    ctx.closePath();
    ctx.stroke();

    // Roaring Lion mane rings on upper arm
    for (let r = 34; r <= 78; r += 14) {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(256, 196, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Mane spikes
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(ang) * 52, 196 + Math.sin(ang) * 52);
      ctx.lineTo(256 + Math.cos(ang) * 88, 196 + Math.sin(ang) * 88);
      ctx.stroke();
    }

    // Forearm Cross (visible in Jean's photo!)
    ctx.fillStyle = 'rgba(20, 25, 32, 0.72)';
    ctx.fillRect(242, 315, 28, 138);
    ctx.fillRect(198, 355, 116, 26);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    ctx.strokeRect(242, 315, 28, 138);
  } else if (style === 'jean_right') {
    // Right shoulder + lower forearm ink matching photo
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(240 + (i % 2) * 35, 85 + i * 18, 22, 0.2, Math.PI * 1.5);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(256, 330 + i * 20, 28, 0, Math.PI * 1.7);
      ctx.stroke();
    }
  } else if (style === 'charles_right') {
    // Charles right-arm full sleeve tattoo (shoulder to wrist)
    const wash = ctx.createLinearGradient(0, 20, 0, 490);
    wash.addColorStop(0, 'rgba(24, 32, 42, 0.42)');
    wash.addColorStop(1, 'rgba(24, 32, 42, 0.28)');
    ctx.fillStyle = wash;
    ctx.fillRect(45, 22, 422, 456);

    for (let y = 55; y < 460; y += 34) {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(45, y);
      ctx.bezierCurveTo(175, y - 22, 335, y + 22, 467, y);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(140 + ((i * 67) % 240), 75 + i * 32, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Charles left arm: upper shoulder & forearm pieces
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(256, 70 + i * 18, 24, 0.3, Math.PI * 1.6);
      ctx.stroke();
    }
    for (let y = 290; y < 460; y += 26) {
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.bezierCurveTo(210, y - 16, 310, y + 16, 420, y);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createShinTattooTexture(
  baseSkinHex: string,
  fighter: 'jean' | 'charles',
  isLeft: boolean,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = baseSkinHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(22, 28, 36, 0.72)';
  ctx.fillStyle = 'rgba(22, 28, 36, 0.45)';

  if (fighter === 'jean') {
    // Both shins have roaring lion portrait tattoos
    ctx.beginPath();
    ctx.arc(128, 128, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    for (let r = 24; r <= 54; r += 10) {
      ctx.beginPath();
      ctx.arc(128, 128, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (!isLeft) {
    // Charles right lower leg tattoo
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 145, 32, 0, Math.PI * 1.8);
    ctx.stroke();
    ctx.fillRect(108, 118, 40, 54);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTorsoTattooTexture(
  baseSkinHex: string,
  fighter: 'jean' | 'charles',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseSkinHex;
  ctx.fillRect(0, 0, 512, 512);

  // Sculpted pectoral & 6-pack shading
  const chestGrad = ctx.createLinearGradient(0, 90, 0, 420);
  chestGrad.addColorStop(0, 'rgba(0,0,0,0.08)');
  chestGrad.addColorStop(0.32, 'rgba(255,255,255,0.08)');
  chestGrad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
  chestGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = chestGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle 6-pack abs shadow lines
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(253, 250, 6, 175);
  for (let row = 0; row < 3; row++) {
    ctx.fillRect(212, 275 + row * 48, 88, 5);
  }

  if (fighter === 'jean') {
    // Left pectoral tattoo visible in Jean's photo
    ctx.strokeStyle = 'rgba(24, 30, 38, 0.7)';
    ctx.fillStyle = 'rgba(24, 30, 38, 0.42)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(298, 172, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(298, 172, 46, 0.2, Math.PI * 1.5);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createShortsTexture(accentHex: string): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle technical fight-short fabric sheen
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let y = 0; y < 512; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Waistband with clean JZN MMA mark
  ctx.fillStyle = '#090b0f';
  ctx.fillRect(0, 0, 512, 76);
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 70, 512, 10);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 800 32px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JZN', 256, 38);

  // Diagonal aggressive side panels matching uploaded shorts
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.moveTo(85, 95);
  ctx.lineTo(138, 95);
  ctx.lineTo(108, 495);
  ctx.lineTo(65, 495);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(374, 95);
  ctx.lineTo(427, 95);
  ctx.lineTo(447, 495);
  ctx.lineTo(404, 495);
  ctx.closePath();
  ctx.fill();

  // Silver accent stripe
  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  ctx.beginPath();
  ctx.moveTo(142, 95);
  ctx.lineTo(154, 95);
  ctx.lineTo(124, 495);
  ctx.lineTo(112, 495);
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
