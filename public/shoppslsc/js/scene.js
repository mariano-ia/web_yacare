// La escena del vestuario: barra de perchas, camisetas, cámara e interacción. Three.js puro, sin build.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRoom, RAIL_Y } from './room.js';
import { METERS_PER_PX } from './data.js';
import { backTexture, frontTexture, tagTexture } from './jersey.js';

const SPACING = 0.125;
const GROUP_GAP = 0.46;
const YAW_REST = 1.2;
const CAM = new THREE.Vector3(0, 1.3, 3.5);
const FOV = 32;
// plano de entrada: la cámara arranca pegada a las camisetas y se retira hasta su sitio
const INTRO_FROM = new THREE.Vector3(1.3, 1.1, 1.5);
const INTRO_LOOK = new THREE.Vector3(0.2, 1.45, 0);
const INTRO_SECONDS = 3.6;
/** la camiseta cuelga esta distancia por debajo de la barra (los hombros, sobre los brazos de la percha) */
const HANG = 0.075;
/** media profundidad del cuerpo de la camiseta: pecho y espalda son dos paneles abombados, como un almohadón */
const DEPTH = 0.045;
/** móviles y tabletas: menos píxeles que mover */
export const LITE = innerWidth < 820 || matchMedia('(pointer: coarse)').matches;
// resolución de la espalda estampada: px de lienzo por px de la textura original
const LOW = LITE ? 0.4 : 0.5, MID = LITE ? 0.6 : 0.75, HIGH = 1;

const { clamp, lerp, smoothstep } = THREE.MathUtils;
const damp = (v, target, k, dt) => v + (target - v) * (1 - Math.exp(-k * dt));

// ----------------------------------------------------------------- tela
// Movimiento de la tela en el vertex shader: una brisa que ondula el tejido (más cuanto más lejos de la
// percha) y un retraso del bajo respecto a los hombros cuando la percha gira o se balancea.
const CLOTH_HEAD = /* glsl */ `
uniform float uTime;
uniform float uPhase;
uniform float uAmp;
uniform float uTwist;
uniform float uHeight;
uniform float uTop;
uniform vec2 uBend;
// 0 en los hombros (apoyados en la percha), 1 en el bajo; uTop - p.y es la distancia al cuello
float clothWeight(vec3 p) { return smoothstep(0.1, uHeight * 0.92, uTop - p.y); }
// x: altura de la onda; yz: su pendiente, para corregir la normal
vec3 clothWave(vec3 p) {
  float a = uTime * 1.3 + p.x * 7.0 + p.y * 8.0 + uPhase;
  float b = uTime * 2.1 + p.x * 13.0 - p.y * 5.0 + uPhase * 1.9;
  float breath = 0.6 + 0.4 * sin(uTime * 0.37 + uPhase * 2.7);
  float h = 0.6 * sin(a) + 0.25 * sin(b);
  vec2 slope = vec2(4.2 * cos(a) + 3.3 * cos(b), 4.8 * cos(a) - 1.3 * cos(b));
  return vec3(h, slope) * breath;
}
vec2 clothTurn(vec2 v, float ang) { float c = cos(ang), s = sin(ang); return vec2(c * v.x + s * v.y, -s * v.x + c * v.y); }
`;
const CLOTH_NORMAL = /* glsl */ `
float cN = clothWeight(position);
objectNormal.xy -= objectNormal.z * uAmp * cN * clothWave(position).yz;
objectNormal.xz = clothTurn(objectNormal.xz, uTwist * cN);
objectNormal = normalize(objectNormal);
`;
const CLOTH_POSITION = /* glsl */ `
float cW = clothWeight(position);
transformed.z += uAmp * cW * clothWave(position).x;
transformed.xz += uBend * cW * cW;
transformed.xz = clothTurn(transformed.xz, uTwist * cW);
`;

function patchCloth(shader, uniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${CLOTH_HEAD}`)
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${CLOTH_NORMAL}`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>\n${CLOTH_POSITION}`);
}

/**
 * Material de una parte de la camiseta: por fuera la foto (con el brillo satinado del poliéster), por dentro tela
 * lisa del color del forro. Lo que depende del kit (recorte por transparencia, oclusión en los colores de vértice)
 * lo fija `LockerRoom.dress`.
 */
function clothMaterial(map, uniforms) {
  const material = new THREE.MeshPhysicalMaterial({
    map,
    roughness: 0.72,
    metalness: 0,
    side: THREE.DoubleSide,
    // brillo satinado del poliéster en los cantos; poco, que la tira de luz aguamarina no tiña las camisetas oscuras
    sheen: 0.14,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xffffff),
  });
  material.onBeforeCompile = (shader) => {
    patchCloth(shader, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uLining;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = uLining;');
  };
  // la sombra tiene que deformarse (y, en los paneles de la v1, recortarse) igual que la tela
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  depth.onBeforeCompile = (shader) => patchCloth(shader, uniforms);
  return { material, depth };
}

// ----------------------------------------------------------------- geometría
/** Panel de pecho o espalda: un rectángulo del tamaño de la foto, abombado hacia afuera en el cuerpo. Cuello en y = 0. */
function panelGeometry(W, H, back) {
  const g = new THREE.PlaneGeometry(W, H, 30, 40);
  g.translate(0, -H / 2, 0);
  const pos = g.attributes.position;
  const bodyHalf = W * 0.36;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const d = -y / H;
    const across = Math.max(0, 1 - (x / bodyHalf) ** 2);
    const bow = DEPTH * Math.pow(across, 0.6) * smoothstep(d, 0.03, 0.22) * (1 - 0.35 * smoothstep(d, 0.8, 1));
    const z = 0.004 + bow;
    // la espalda se espeja en x: queda mirando a -z y su foto se ve derecha desde atrás
    pos.setXYZ(i, back ? -x : x, y, back ? -z : z);
  }
  g.computeVertexNormals();
  return g;
}

/** Percha de madera: dos brazos que bajan del centro. Origen en el centro de la barra. */
function hangerGeometry() {
  const pts = [[-0.205, -0.1], [-0.15, -0.082], [-0.08, -0.066], [0, -0.06], [0.08, -0.066], [0.15, -0.082], [0.205, -0.1]];
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'catmullrom', 0.3);
  return new THREE.TubeGeometry(curve, 24, 0.0085, 8, false);
}

/** Gancho: un arco que abraza la barra y un tallo hasta la percha. En el plano xy; en la barra se gira de través. */
function hookGeometry() {
  const pts = [];
  for (let a = -0.25; a <= Math.PI + 0.9; a += 0.18) pts.push(new THREE.Vector3(Math.cos(a) * 0.021, Math.sin(a) * 0.021, 0));
  pts.push(new THREE.Vector3(-0.004, -0.036, 0), new THREE.Vector3(0, -0.062, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  return new THREE.TubeGeometry(curve, 40, 0.0028, 8, false);
}

// ----------------------------------------------------------------- escena
export class LockerRoom {
  /** Hueco de pantalla (0..1) que la interfaz deja a la camiseta abierta. `tuck`: parte del alto que puede quedar tras la ficha */
  stageRect = { x0: 0.02, y0: 0.12, x1: 0.55, y1: 0.88, tuck: 0 };
  /** true mientras el hover lo controla el teclado */
  kbd = false;

  constructor(canvas, hangers, assets, cb) {
    this.canvas = canvas;
    this.assets = assets;
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, LITE ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070706);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.18;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 40);
    this.camera.position.copy(CAM);
    this.dim = buildRoom(this.scene, this.anisotropy, LITE).dim;
    this.rail = new THREE.Group();
    this.scene.add(this.rail);

    this.items = [];
    this.filter = null;
    this.hover = null;
    this.selected = null;
    this.groups = [];
    this.bounds = { min: 0, max: 0 };
    this.scroll = 0;
    this.scrollTarget = 0;
    this.scrollVel = 0;
    this.userYaw = 0;
    this.yawVel = 0;
    this.stageSince = 0;
    this.pointer = { x: 0, y: 0, inside: false, down: false, moved: 0, startX: 0, startY: 0, lastX: 0, lastT: 0, touch: false };
    this.dragging = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.touch = matchMedia('(hover: none)').matches;
    this.raf = 0;
    this.tmp = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.clothTime = { value: 0 };
    this.parallax = { x: 0, y: 0 };
    this.sharp = [];
    this.sharpTimer = 0;
    this.intro = 0;
    this.introSpeed = 1 / INTRO_SECONDS;
    this.introDone = false;
    this.railSpeed = 0;
    this.time = 0;
    this.last = performance.now();
    this.tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

    // geometrías y texturas de pecho compartidas por kit. Con modelo simulado (.glb) la camiseta, la percha y el
    // gancho vienen de Blender, ya en el espacio de la barra; sin él, los dos paneles abombados de la v1.
    this.hangerGeo = hangerGeometry();
    this.hookGeo = hookGeometry();
    this.geos = {};
    this.frontTex = {};
    this.size = { width: 0, bottom: 0 };
    for (const [key, kit] of Object.entries(assets.kits)) {
      const W = kit.size[0] * METERS_PER_PX, H = kit.size[1] * METERS_PER_PX;
      let geo;
      // top/bottom: en el espacio del pivote (la barra); localTop: lo alto de la tela en el espacio de su malla
      if (kit.model) {
        const m = kit.model;
        m.front.computeBoundingBox();
        m.back.computeBoundingBox();
        const box = m.front.boundingBox.clone().union(m.back.boundingBox);
        geo = {
          mode: 'glb', front: m.front, back: m.back, gusset: m.gusset, hanger: m.hanger, hook: m.hook,
          width: box.max.x - box.min.x, height: box.max.y - box.min.y, top: box.max.y, bottom: box.min.y, localTop: box.max.y, offset: 0,
          ao: !!m.front.attributes.color,
        };
      } else {
        geo = {
          mode: 'panel', front: panelGeometry(W, H, false), back: panelGeometry(W, H, true), gusset: null, hanger: this.hangerGeo, hook: this.hookGeo,
          width: W, height: H, top: -HANG, bottom: -(HANG + H), localTop: 0, offset: -HANG, ao: false,
        };
      }
      this.geos[key] = geo;
      this.frontTex[key] = frontTexture(kit, this.anisotropy);
      this.size.width = Math.max(this.size.width, geo.width);
      this.size.bottom = Math.min(this.size.bottom, geo.bottom);
    }
    this.wood = new THREE.MeshPhysicalMaterial({ color: 0x9a6a3a, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 });
    this.metal = new THREE.MeshStandardMaterial({ color: 0xd8d8d4, roughness: 0.25, metalness: 1 });

    hangers.forEach((h, i) => this.add(h, i, true));
    // la camiseta del personalizador: no cuelga de la barra, solo aparece en primer plano
    this.custom = this.add({ id: 'custom', kit: 'home', group: 'HOME', number: 10, name: 'YOUR NAME' }, hangers.length, false);
    this.custom.scale = 0.0001;

    this.layout();
    for (const it of this.items) { it.x = it.restX; it.prevWorldX = it.x; }
    if (this.reduced) this.intro = 1;
    this.bind();
    this.resize();
    // los topes dependen del tamaño real del lienzo: la barra arranca en su extremo izquierdo
    this.scroll = this.scrollTarget = this.bounds.min;
    this.raf = requestAnimationFrame(this.tick);
  }

  add(data, i, onRail) {
    const kit = this.assets.kits[data.kit];
    const phase = (i * 2.399) % 6.283;
    const uniforms = {
      uTime: this.clothTime,
      uPhase: { value: phase },
      uAmp: { value: this.reduced ? 0 : 0.009 },
      uTwist: { value: 0 },
      uBend: { value: new THREE.Vector2() },
      uHeight: { value: 0 },
      uTop: { value: 0 },
      uLining: { value: new THREE.Color() },
    };
    const lowRes = backTexture(kit, data.name, String(data.number), LOW, this.anisotropy);
    const fm = clothMaterial(this.frontTex[data.kit], uniforms);
    const bm = clothMaterial(lowRes, uniforms);
    const gm = clothMaterial(null, uniforms);
    const front = new THREE.Mesh(undefined, fm.material);
    front.customDepthMaterial = fm.depth;
    const back = new THREE.Mesh(undefined, bm.material);
    back.customDepthMaterial = bm.depth;
    const gusset = new THREE.Mesh(undefined, gm.material);
    gusset.customDepthMaterial = gm.depth;
    for (const m of [front, back, gusset]) m.castShadow = m.receiveShadow = true;
    const hanger = new THREE.Mesh(undefined, this.wood);
    hanger.castShadow = true;
    const hook = new THREE.Mesh(undefined, this.metal);
    hook.rotation.y = Math.PI / 2;
    hook.castShadow = true;
    const turn = new THREE.Group();
    turn.add(front, back, gusset, hanger);
    const pivot = new THREE.Group();
    pivot.position.y = RAIL_Y;
    pivot.add(turn, hook);
    if (onRail) {
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTexture(data.number), depthWrite: false }));
      tag.scale.setScalar(0.042);
      tag.position.set(0.016, -0.042, 0.03);
      pivot.add(tag);
    }
    this.rail.add(pivot);
    const item = {
      data, pivot, turn, hook, hanger, hookYaw: Math.PI / 2, front, back, gusset, uniforms, lowRes, hiRes: undefined, hiK: 0, phase,
      active: onRail, restX: 0, x: 0, y: 0, z: 0, yaw: YAW_REST, scale: 1,
      // arrancan meciéndose, como si alguien acabara de pasar la mano por la barra
      swing: this.reduced ? 0 : 0.2 * Math.sin(i * 1.3 + 0.6), swingVel: 0, prevWorldX: 0, prevVel: 0,
      lagYaw: YAW_REST, lagYawVel: 0, lagSwing: 0, lagSwingVel: 0,
    };
    this.dress(item, data.kit);
    this.setBackMap(item, lowRes);
    this.items.push(item);
    return item;
  }

  /** Viste una percha con un kit: geometrías, forro, recorte por transparencia (solo paneles) y oclusión horneada. */
  dress(it, key) {
    const kit = this.assets.kits[key];
    const geo = this.geos[key];
    it.front.geometry = geo.front;
    it.back.geometry = geo.back;
    // el fuelle (los costados) solo existe en la camiseta simulada
    it.gusset.geometry = geo.gusset ?? new THREE.BufferGeometry();
    it.gusset.visible = !!geo.gusset;
    it.hanger.geometry = geo.hanger;
    it.hook.geometry = geo.hook;
    for (const m of [it.front, it.back, it.gusset]) m.position.y = geo.offset;
    it.uniforms.uHeight.value = geo.height;
    it.uniforms.uTop.value = geo.localTop;
    it.uniforms.uLining.value.set(kit.lining);
    it.gusset.material.color.set(kit.lining);
    const cut = geo.mode === 'panel' ? 0.45 : 0;
    for (const m of [it.front, it.back, it.gusset]) {
      m.material.alphaTest = m === it.gusset ? 0 : cut;
      m.material.vertexColors = geo.ao;
      m.customDepthMaterial.alphaTest = m.material.alphaTest;
      m.material.needsUpdate = m.customDepthMaterial.needsUpdate = true;
    }
    it.front.material.map = this.frontTex[key];
    it.front.customDepthMaterial.map = cut ? this.frontTex[key] : null;
  }

  setBackMap(it, tex) {
    it.back.material.map = tex;
    it.back.customDepthMaterial.map = it.back.material.alphaTest ? tex : null;
  }

  /** Acorta el plano de entrada (cualquier clic o tecla durante la intro) */
  skipIntro() {
    if (!this.introDone) this.introSpeed = Math.max(this.introSpeed, 2.2);
  }

  get ready() {
    return this.introDone;
  }

  // ------------------------------------------------------------- API pública

  setFilter(group) {
    this.filter = group;
    for (const it of this.items) it.active = it !== this.custom && (!group || it.data.group === group);
    this.layout();
    this.scrollTarget = this.bounds.min;
    this.scrollVel = 0;
    this.setHover(null);
  }

  select(id) {
    const next = id ? this.items.find((i) => i.data.id === id && (i.active || i === this.custom)) ?? null : null;
    if (next === this.selected) return;
    this.selected = next;
    // la del personalizador se abre de espaldas: lo que importa es el estampado
    this.userYaw = next === this.custom ? Math.PI : 0;
    this.yawVel = 0;
    if (next) {
      this.sharpen(next, HIGH);
      this.stageSince = this.time;
      // deja el hueco de la percha centrado para cuando vuelva
      if (next !== this.custom) this.scrollTarget = clamp(next.restX, this.bounds.min, this.bounds.max);
      this.scrollVel = 0;
      this.setHover(null);
    }
    this.canvas.style.cursor = next ? 'grab' : '';
    this.cb.onSelect(next?.data ?? null);
  }

  step(dir) {
    const list = this.items.filter((i) => i.active);
    if (!list.length) return;
    const from = this.selected ?? this.hover;
    const i = from ? list.indexOf(from) : dir > 0 ? -1 : 0;
    const next = list[(i + dir + list.length) % list.length];
    if (this.selected) this.select(next.data.id);
    else {
      this.setHover(next);
      this.scrollTarget = clamp(next.restX, this.bounds.min, this.bounds.max);
    }
  }

  /** Cambia el kit, el nombre y el dorsal de la camiseta del personalizador y la vuelve a estampar */
  setCustom(kit, name, number) {
    const it = this.custom;
    if (kit !== it.data.kit) {
      it.data.kit = kit;
      this.dress(it, kit);
    }
    it.data.name = name;
    it.data.number = number;
    const k = this.assets.kits[kit];
    it.lowRes.dispose();
    it.lowRes = backTexture(k, name, number, LOW, this.anisotropy);
    if (it.hiRes) {
      it.hiRes.dispose();
      it.hiRes = backTexture(k, name, number, it.hiK, this.anisotropy);
    }
    this.setBackMap(it, it.hiRes ?? it.lowRes);
  }

  /** Percha que queda en el centro de la pantalla (en táctil hace de «cursor») */
  centred() {
    const x = -this.rail.position.x;
    let best = null, bd = Infinity;
    for (const it of this.items) {
      const d = Math.abs(it.restX - x);
      if (it.active && d < bd) { bd = d; best = it; }
    }
    return best;
  }

  openHovered() {
    if (this.hover) this.select(this.hover.data.id);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
  }

  // ------------------------------------------------------------------ layout

  viewHalf(dist = CAM.z) {
    return this.tanHalf * dist * this.camera.aspect;
  }

  layout() {
    const visible = this.items.filter((i) => i.active);
    let x = 0;
    let prev = null;
    for (const it of visible) {
      if (prev && it.data.group !== prev) x += GROUP_GAP;
      it.restX = x;
      x += SPACING;
      prev = it.data.group;
    }
    const shift = visible.length ? (visible[0].restX + visible[visible.length - 1].restX) / 2 : 0;
    this.groups = [];
    for (const it of visible) {
      it.restX -= shift;
      const g = this.groups.find((g) => g.key === it.data.group);
      if (g) g.maxX = it.restX;
      else this.groups.push({ key: it.data.group, minX: it.restX, maxX: it.restX });
    }
    this.updateBounds();
  }

  updateBounds() {
    const visible = this.items.filter((i) => i.active);
    if (!visible.length) { this.bounds = { min: 0, max: 0 }; return; }
    const pad = 0.55, half = this.viewHalf();
    const min = visible[0].restX - pad + half, max = visible[visible.length - 1].restX + pad - half;
    this.bounds = min < max ? { min, max } : { min: 0, max: 0 };
  }

  /** Pose en primer plano: la camiseta abierta se encaja en `stageRect` */
  stagePose(out) {
    const d = 2.1, r = this.stageRect;
    const vh = 2 * d * this.tanHalf, vw = vh * this.camera.aspect;
    const geo = this.geos[(this.selected ?? this.custom).data.kit];
    const height = 0.03 - geo.bottom; // del gancho al bajo
    const width = geo.width + 0.04;
    const rh = (r.y1 - r.y0) * vh, rw = (r.x1 - r.x0) * vw;
    const scale = Math.max(0.2, Math.min(1.25, (rh * 0.9) / height / (1 - r.tuck), (rw * 0.92) / width));
    // si cabe entera va centrada; si no (móvil), cuelga desde arriba y el bajo se esconde tras la ficha
    const y = height * scale <= rh * 0.95
      ? CAM.y + (0.5 - (r.y0 + r.y1) / 2) * vh + (height / 2 - 0.03) * scale
      : CAM.y + (0.5 - r.y0) * vh - rh * 0.03 - 0.03 * scale;
    out.set(((r.x0 + r.x1) / 2 - 0.5) * vw, y, CAM.z - d);
    return { pos: out, scale };
  }

  bind() {
    const c = this.canvas;
    new ResizeObserver(() => this.resize()).observe(c);

    c.addEventListener('pointerdown', (e) => {
      if (!this.introDone) return this.skipIntro();
      c.setPointerCapture(e.pointerId);
      const p = this.pointer;
      Object.assign(p, { down: true, moved: 0, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastT: performance.now(), touch: e.pointerType !== 'mouse', inside: true });
      this.setPointer(e);
      this.scrollVel = 0;
      this.yawVel = 0;
    });
    c.addEventListener('pointermove', (e) => {
      const p = this.pointer;
      p.inside = true;
      this.setPointer(e);
      if (!p.down) return;
      const dx = e.clientX - p.lastX, now = performance.now(), dt = Math.max(1, now - p.lastT) / 1000;
      p.moved = Math.max(p.moved, Math.hypot(e.clientX - p.startX, e.clientY - p.startY));
      if (p.moved > 6 && !this.dragging) {
        this.dragging = true;
        c.style.cursor = 'grabbing';
        this.setHover(null);
      }
      if (this.dragging) {
        if (this.selected) {
          const d = dx * 0.011;
          this.userYaw += d;
          this.yawVel = d / dt;
        } else {
          const unit = (2 * this.viewHalf()) / c.clientWidth;
          this.scrollTarget -= dx * unit;
          this.scrollVel = (-dx * unit) / dt;
        }
      }
      p.lastX = e.clientX;
      p.lastT = now;
    });
    const up = (e) => {
      const p = this.pointer;
      if (!p.down) return;
      p.down = false;
      const wasDrag = this.dragging;
      this.dragging = false;
      c.style.cursor = this.selected ? 'grab' : '';
      if (performance.now() - p.lastT > 80) { this.scrollVel = 0; this.yawVel = 0; }
      if (wasDrag || e.type === 'pointercancel') return;
      if (this.selected) {
        // clic sobre la camiseta = darle la vuelta; fuera = volver al vestuario
        this.raycaster.setFromCamera(new THREE.Vector2(p.x, p.y), this.camera);
        if (this.raycaster.intersectObjects([this.selected.front, this.selected.back]).length) {
          this.userYaw = Math.round(this.userYaw / Math.PI + 1) * Math.PI;
        } else this.select(null);
      } else {
        const target = this.pick();
        if (target) this.select(target.data.id);
      }
      if (p.touch) p.inside = false;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', () => { this.pointer.inside = false; });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!this.introDone) return this.skipIntro();
      if (this.selected) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      this.scrollTarget += d * 0.0016;
    }, { passive: false });
  }

  setPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  /** Percha más cercana al puntero, usando los huecos en reposo (estable, sin parpadeos) */
  pick() {
    this.raycaster.setFromCamera(new THREE.Vector2(this.pointer.x, this.pointer.y), this.camera);
    const { origin, direction } = this.raycaster.ray;
    if (Math.abs(direction.z) < 1e-5) return null;
    const t = (0.1 - origin.z) / direction.z;
    const wx = origin.x + direction.x * t, wy = origin.y + direction.y * t;
    if (wy > RAIL_Y + 0.06 || wy < RAIL_Y + this.size.bottom - 0.1) return null;
    const lx = wx - this.rail.position.x;
    let best = null, bd = 0.17;
    for (const it of this.items) {
      if (!it.active) continue;
      const d = Math.abs(it.restX - lx);
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }

  /** Cambia la espalda de una camiseta por una versión nítida; solo se conservan las tres últimas */
  sharpen(it, k) {
    if (it.hiK < k) {
      it.hiRes?.dispose();
      it.hiRes = backTexture(this.assets.kits[it.data.kit], it.data.name, String(it.data.number), k, this.anisotropy);
      it.hiK = k;
      this.setBackMap(it, it.hiRes);
    }
    this.sharp = [it, ...this.sharp.filter((s) => s !== it)];
    for (const old of this.sharp.splice(3)) {
      if (old === this.selected) { this.sharp.push(old); continue; }
      this.setBackMap(old, old.lowRes);
      old.hiRes?.dispose();
      old.hiRes = undefined;
      old.hiK = 0;
    }
  }

  setHover(it) {
    if (it === this.hover) return;
    this.hover = it;
    clearTimeout(this.sharpTimer);
    // si el cursor se queda sobre una camiseta, se le sube la resolución
    if (it) this.sharpTimer = window.setTimeout(() => this.hover === it && this.sharpen(it, MID), 140);
    if (!this.selected) this.canvas.style.cursor = it ? 'pointer' : '';
    this.cb.onHover(it?.data ?? null);
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // en pantallas estrechas se abre el ángulo para que quepan varias perchas
    this.tanHalf = Math.max(Math.tan(THREE.MathUtils.degToRad(FOV / 2)), 0.6 / (CAM.z * this.camera.aspect));
    this.camera.fov = THREE.MathUtils.radToDeg(Math.atan(this.tanHalf)) * 2;
    this.camera.updateProjectionMatrix();
    this.updateBounds();
    this.renderer.render(this.scene, this.camera);
  }

  // ------------------------------------------------------------------- bucle

  tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 1 / 20) || 1 / 60;
    this.last = now;
    const time = (this.time += dt);
    this.clothTime.value = time;
    const p = this.pointer;

    // desplazamiento de la barra con inercia y tope elástico
    if (!this.dragging && !this.selected) {
      this.scrollTarget += this.scrollVel * dt;
      this.scrollVel *= Math.exp(-3.2 * dt);
    }
    const { min, max } = this.bounds;
    const over = this.scrollTarget < min ? this.scrollTarget - min : this.scrollTarget > max ? this.scrollTarget - max : 0;
    if (over && !this.dragging) {
      this.scrollTarget -= over * (1 - Math.exp(-9 * dt));
      this.scrollVel *= 0.8;
    }
    this.scroll = damp(this.scroll, this.scrollTarget - over * 0.6 * +this.dragging, 9, dt);
    this.railSpeed = damp(this.railSpeed, (-this.scroll - this.rail.position.x) / dt, 14, dt);
    this.rail.position.x = -this.scroll;

    // cámara: plano de entrada y, después, un ligero paralaje con el cursor
    if (!this.introDone) {
      this.intro = Math.min(1, this.intro + dt * this.introSpeed);
      if (this.intro >= 1) {
        this.introDone = true;
        this.cb.onIntroEnd();
      }
    }
    const e = this.intro < 0.5 ? 4 * this.intro ** 3 : 1 - (-2 * this.intro + 2) ** 3 / 2;
    const par = this.selected || this.reduced || !this.introDone ? 0 : 1;
    this.parallax.x = damp(this.parallax.x, p.inside ? p.x * 0.07 * par : 0, 3, dt);
    this.parallax.y = damp(this.parallax.y, p.inside ? p.y * 0.035 * par : 0, 3, dt);
    this.camera.position.set(
      lerp(INTRO_FROM.x, this.parallax.x, e),
      lerp(INTRO_FROM.y, CAM.y + this.parallax.y, e),
      lerp(INTRO_FROM.z, CAM.z, e),
    );
    this.camera.lookAt(lerp(INTRO_LOOK.x, this.parallax.x * 0.4, e), lerp(INTRO_LOOK.y, CAM.y, e), 0);
    this.camera.updateMatrixWorld();

    if (!this.introDone) this.setHover(null);
    else if (!this.selected && !this.dragging && p.inside && !p.touch) this.setHover(this.pick());
    else if (this.touch && !this.selected && !this.kbd) {
      // sin cursor: la camiseta del centro se gira sola al pasar, y la barra se asienta sobre ella
      const c = this.centred();
      this.setHover(c);
      if (c && !this.dragging && Math.abs(this.scrollVel) < 0.25) {
        this.scrollTarget = damp(this.scrollTarget, clamp(c.restX, this.bounds.min, this.bounds.max), 5, dt);
      }
    } else if (!p.inside && !this.selected && !p.touch && this.hover && !this.kbd) this.setHover(null);

    // camiseta en primer plano
    if (this.selected && !this.dragging) {
      this.userYaw += this.yawVel * dt;
      this.yawVel *= Math.exp(-2.6 * dt);
    }
    const stage = this.stagePose(this.tmp);
    const sway = this.reduced ? 0 : Math.sin((time - this.stageSince) * 0.7) * 0.16;

    const visible = this.items.filter((i) => i.active);
    const hi = this.hover && !this.selected ? visible.indexOf(this.hover) : -1;

    for (const it of this.items) {
      let tx = it.restX, ty = 0, tz = 0, yaw = YAW_REST, sc = it.active ? 1 : 0.0001, k = 7;
      if (it === this.selected) {
        tx = stage.pos.x - this.rail.position.x;
        ty = stage.pos.y - RAIL_Y;
        tz = stage.pos.z;
        sc = stage.scale;
        yaw = this.userYaw + sway;
        k = 5.5;
      } else if (hi >= 0) {
        const d = visible.indexOf(it) - hi;
        if (d === 0) { tz = 0.34; yaw = 0; sc = 1.07; k = 9; }
        else if (it.active) tx += Math.sign(d) * 0.22 * Math.exp(-(Math.abs(d) - 1) / 7);
      }
      it.x = damp(it.x, tx, k, dt);
      it.y = damp(it.y, ty, k, dt);
      it.z = damp(it.z, tz, k, dt);
      it.yaw = damp(it.yaw, yaw, it === this.selected ? 7 : k, dt);
      it.scale = damp(it.scale, sc, 9, dt);

      // péndulo: la aceleración lateral hace balancear la percha
      const worldX = it.x + this.rail.position.x;
      const vel = (worldX - it.prevWorldX) / dt;
      const acc = clamp((vel - it.prevVel) / dt, -60, 60);
      it.prevWorldX = worldX;
      it.prevVel = vel;
      if (this.reduced || it === this.selected) {
        it.swing = damp(it.swing, 0, 8, dt);
        it.swingVel = 0;
      } else {
        // una corriente muy leve mantiene las perchas vivas aunque nadie las toque
        const breeze = 0.5 * Math.sin(time * 0.7 + it.phase) + 0.3 * Math.sin(time * 1.31 + it.phase * 2.1);
        it.swingVel += (-34 * it.swing - 3.4 * it.swingVel + acc * 0.085 + breeze) * dt;
        it.swing = clamp(it.swing + it.swingVel * dt, -0.55, 0.55);
      }

      // la tela sigue a la percha con retraso: el bajo se retuerce al girar y se queda atrás al balancearse
      if (this.reduced) {
        it.lagYaw = it.yaw;
        it.lagSwing = it.swing;
      } else {
        it.lagYawVel += ((it.yaw - it.lagYaw) * 70 - it.lagYawVel * 8) * dt;
        it.lagYaw += it.lagYawVel * dt;
        it.lagSwingVel += ((it.swing - it.lagSwing) * 55 - it.lagSwingVel * 6) * dt;
        it.lagSwing += it.lagSwingVel * dt;
      }
      const bend = clamp(it.lagSwing - it.swing, -0.35, 0.35) * 0.7;
      it.uniforms.uTwist.value = clamp(it.lagYaw - it.yaw, -0.7, 0.7);
      it.uniforms.uBend.value.set(Math.cos(it.yaw) * bend, Math.sin(it.yaw) * bend);

      it.pivot.visible = it.scale > 0.01;
      it.pivot.position.set(it.x, RAIL_Y + it.y, it.z);
      it.pivot.rotation.z = it.swing;
      it.pivot.scale.setScalar(it.scale);
      it.turn.rotation.y = it.yaw;
      // en la barra el gancho queda de través; al descolgar la camiseta se alinea con ella
      it.hookYaw = damp(it.hookYaw, it === this.selected ? it.yaw : Math.PI / 2, 6, dt);
      it.hook.rotation.y = it.hookYaw;
    }

    const dimTo = this.selected ? 0.78 : 0;
    this.dim.material.opacity = damp(this.dim.material.opacity, dimTo, 6, dt);
    this.dim.visible = this.dim.material.opacity > 0.005;

    this.renderer.render(this.scene, this.camera);
    this.cb.onFrame(this.frameState());
  };

  project(x, y, z) {
    const v = this.tmp.set(x, y, z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.canvas.clientWidth, y: (-v.y * 0.5 + 0.5) * this.canvas.clientHeight };
  }

  frameState() {
    const w = this.canvas.clientWidth;
    const groups = this.groups.map((g) => {
      const p = this.project(g.minX + this.rail.position.x - 0.06, RAIL_Y + 0.07, 0);
      const end = this.project(g.maxX + this.rail.position.x + 0.2, RAIL_Y, 0).x;
      // la etiqueta se queda pegada al borde mientras su grupo siga en pantalla
      const x = Math.min(Math.max(p.x, 20), Math.max(end - 150, 20));
      return { key: g.key, x, y: p.y, visible: end > 60 && p.x < w - 40 };
    });
    let caption = null;
    const h = this.hover;
    if (h && !this.selected) {
      caption = this.project(h.x + this.rail.position.x, RAIL_Y + this.size.bottom * h.scale - 0.07, h.z);
    }
    return { groups, caption, stage: !!this.selected, speed: this.selected ? 0 : this.railSpeed };
  }
}
