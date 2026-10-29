// El vestuario: pared de lamas en tinta, tira de luz aguamarina, barra de acero, banco, piso y luces.
import * as THREE from 'three';

export const RAIL_Y = 1.8;
const LENGTH = 34;

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lamas verticales oscuras, con grano y una ranura entre lama y lama (color + relieve). */
function slatTextures() {
  const S = 1024, slats = 8, w = S / slats;
  const rand = rng(11);
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = color.height = bump.width = bump.height = S;
  const c = color.getContext('2d'), b = bump.getContext('2d');
  b.fillStyle = '#fff';
  b.fillRect(0, 0, S, S);
  for (let i = 0; i < slats; i++) {
    const tone = 0.85 + rand() * 0.3;
    const g = c.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    g.addColorStop(0, `rgb(${30 * tone},${31 * tone},${30 * tone})`);
    g.addColorStop(0.5, `rgb(${40 * tone},${41 * tone},${39 * tone})`);
    g.addColorStop(1, `rgb(${27 * tone},${28 * tone},${27 * tone})`);
    c.fillStyle = g;
    c.fillRect(i * w, 0, w, S);
    for (let k = 0; k < 40; k++) {
      const x = i * w + rand() * w, wob = (rand() - 0.5) * 8;
      c.strokeStyle = `rgba(${rand() > 0.5 ? '0,0,0' : '90,92,88'},${0.04 + rand() * 0.1})`;
      c.lineWidth = 0.6 + rand() * 1.4;
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(x + wob, S * 0.33, x - wob, S * 0.66, x, S);
      c.stroke();
    }
    c.fillStyle = '#050505';
    c.fillRect(i * w, 0, 10, S);
    const gg = b.createLinearGradient(i * w, 0, i * w + 20, 0);
    gg.addColorStop(0, '#000');
    gg.addColorStop(0.5, '#000');
    gg.addColorStop(1, '#fff');
    b.fillStyle = gg;
    b.fillRect(i * w, 0, 20, S);
  }
  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bump);
  for (const t of [map, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(LENGTH / 0.9, 1);
  }
  return { map, bumpMap };
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(170,246,230,1)');
  g.addColorStop(0.3, 'rgba(170,246,230,0.4)');
  g.addColorStop(1, 'rgba(170,246,230,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildRoom(scene, anisotropy, lite = false) {
  const room = new THREE.Group();
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    room.add(m);
    return m;
  };

  const { map, bumpMap } = slatTextures();
  map.anisotropy = anisotropy;
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(LENGTH, 3.4),
    new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale: 2.2, roughness: 0.75, metalness: 0.05, color: 0x8f8f8a }),
  );
  wall.position.set(0, 1.7, -0.5);
  wall.receiveShadow = true;
  room.add(wall);

  const ink = new THREE.MeshStandardMaterial({ color: 0x121210, roughness: 0.55, metalness: 0.1 });
  const inkSoft = new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: 0.6 });
  const seat = new THREE.MeshStandardMaterial({ color: 0x0f0f0e, roughness: 0.45 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xcfd3d6, roughness: 0.28, metalness: 1 });
  const aqua = new THREE.MeshStandardMaterial({ color: 0xaaf6e6, emissive: 0xaaf6e6, emissiveIntensity: 0.5, roughness: 0.4 });

  // altillo con la tira de luz aguamarina
  box(LENGTH, 1.6, 0.9, ink, 0, 3.0, -0.1);
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(LENGTH, 0.006, 0.03),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 1.7, 1.55), toneMapped: false }),
  );
  led.position.set(0, 2.194, -0.4);
  room.add(led);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(LENGTH, 1.5),
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  glow.position.set(0, 2.2 - 0.75, -0.495);
  room.add(glow);

  // banco con una línea aguamarina en el canto
  box(LENGTH, 0.07, 0.95, inkSoft, 0, 0.52, -0.05);
  box(LENGTH, 0.06, 0.8, seat, 0, 0.585, -0.08);
  box(LENGTH, 0.5, 0.05, ink, 0, 0.25, 0.38);
  const stripe = box(LENGTH, 0.012, 0.01, aqua, 0, 0.5, 0.41);
  stripe.receiveShadow = false;

  // separadores y soportes de la barra
  for (let x = -LENGTH / 2 + 1; x < LENGTH / 2; x += 1.9) {
    const sep = box(0.03, 1.66, 0.36, inkSoft, x, 1.38, -0.32);
    sep.castShadow = true;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.39, 10), steel);
    arm.position.set(x, RAIL_Y + 0.195, 0);
    room.add(arm);
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, LENGTH, 16), steel);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, RAIL_Y, 0);
  rail.castShadow = true;
  room.add(rail);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(LENGTH, 10),
    new THREE.MeshStandardMaterial({ color: 0x0b0b0a, roughness: 0.32, metalness: 0.25 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 3;
  floor.receiveShadow = true;
  room.add(floor);

  // luces: una principal alta y lateral (sombras), un relleno frío y el baño aguamarina de la tira
  scene.add(new THREE.HemisphereLight(0xe8f2ef, 0x0a0a09, 0.22));
  const key = new THREE.DirectionalLight(0xfff4e6, 3.2);
  key.position.set(3.1, 4.6, 2.6);
  key.target.position.set(0, 1.2, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(lite ? 1024 : 2048);
  const sc = key.shadow.camera;
  sc.left = -4.5; sc.right = 4.5; sc.top = 2.2; sc.bottom = -2.2; sc.near = 1; sc.far = 12;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.009;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xbfe9e0, 0.5);
  fill.position.set(-3.5, 2.2, 3);
  scene.add(fill);
  const strip = new THREE.PointLight(0xaaf6e6, 1.6, 5, 1.6);
  strip.position.set(0, 2.1, 0.5);
  scene.add(strip);

  // velo que oscurece el vestuario cuando hay una camiseta en primer plano
  const dim = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 20),
    new THREE.MeshBasicMaterial({ color: 0x060605, transparent: true, opacity: 0, depthWrite: false }),
  );
  dim.position.set(0, 1.3, 0.85);
  dim.visible = false;
  scene.add(dim);

  scene.add(room);
  return { dim };
}
