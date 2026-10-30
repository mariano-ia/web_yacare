// Texturas de las camisetas: las fotos recortadas de cada kit y el estampado (nombre + dorsal) pintado en un canvas.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { KITS, SHOP } from './data.js';

const ASSETS = new URL('../assets/', import.meta.url).href;

/** Letra del nombre y de las cifras. Son las de marca; cuando haya tipografía oficial de estampado se cambia acá. */
export const NAME_FONT = { family: '"Druk Text Wide"', weight: 800 };
export const NUMBER_FONT = { family: '"Druk Text Wide"', weight: 800 };

export const cleanName = (text) =>
  text.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑÇ0-9 .'-]/g, '').slice(0, SHOP.maxName);
export const cleanNumber = (text) => text.replace(/\D/g, '').slice(0, SHOP.maxNumber);

function image(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

/**
 * Geometrías del .glb simulado (tools/kit/sim.py), en el espacio del modelo (origen en la barra) y con las UV
 * en la convención de three.js (v = 0 abajo), para usarlas con las mismas texturas que los paneles.
 */
function extractModel(gltf) {
  gltf.scene.updateMatrixWorld(true);
  const parts = {};
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const uv = g.attributes.uv;
    if (uv) {
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
      uv.needsUpdate = true;
    }
    parts[o.material?.name || o.name] = g;
  });
  for (const k of ['front', 'back', 'gusset', 'hanger', 'hook']) if (!parts[k]) throw new Error(`Falta "${k}" en el modelo`);
  return parts;
}

/** Carga las fotos de todos los kits, las anclas del dorsal y, si lo hay, el modelo simulado. `onProgress(0..1)`. */
export async function loadKitAssets(onProgress) {
  const [anchorWhite, anchorBlack] = await Promise.all([image(`${ASSETS}brand/anchor-white.png`), image(`${ASSETS}brand/anchor-black.webp`)]);
  const keys = Object.keys(KITS);
  const kits = {};
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); // los .glb van comprimidos con meshopt
  let done = 0;
  await Promise.all(
    keys.map(async (key) => {
      const [front, back, model] = await Promise.all([
        image(`${ASSETS}kits/${key}-front.webp`),
        image(`${ASSETS}kits/${key}-back.webp`),
        KITS[key].model
          ? loader.loadAsync(`${ASSETS}models/${KITS[key].model}`).then(extractModel).catch((err) => {
              console.warn(`Sin modelo simulado para ${key}, se usan los paneles:`, err.message);
              return null;
            })
          : null,
      ]);
      kits[key] = { ...KITS[key], key, front, back, model, anchorImg: KITS[key].anchor === 'white' ? anchorWhite : anchorBlack };
      if (model) {
        // la camiseta simulada no recorta por transparencia: texturas opacas con el borde extendido hacia afuera,
        // para que los triángulos del contorno no tomen el fondo de la foto
        kits[key].frontBase = bleed(front, KITS[key].lining);
        kits[key].backBase = bleed(back, KITS[key].lining);
      }
      onProgress?.(++done / keys.length);
    }),
  );
  return { kits };
}

/**
 * Copia opaca de una foto recortada: debajo, el color del forro y la foto corrida unos píxeles en ocho direcciones
 * (el borde de la prenda se extiende hacia afuera); encima, la foto.
 */
function bleed(img, fill) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, c.width, c.height);
  for (const r of [14, 9, 6, 4, 2, 1]) {
    for (let a = 0; a < 8; a++) ctx.drawImage(img, Math.round(Math.cos((a * Math.PI) / 4) * r), Math.round(Math.sin((a * Math.PI) / 4) * r));
  }
  ctx.drawImage(img, 0, 0);
  return c;
}

export function frontTexture(kit, anisotropy) {
  const tex = kit.frontBase ? new THREE.CanvasTexture(kit.frontBase) : new THREE.Texture(kit.front);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

/** Tamaño de letra con el que las mayúsculas (o cifras) de `text` miden `height`; se achica si no entra en `maxWidth`. */
function fitFont(ctx, font, text, height, maxWidth) {
  let size = height * 1.4;
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  const asc = ctx.measureText(text).actualBoundingBoxAscent || size * 0.72;
  size *= height / asc;
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth) {
    size *= maxWidth / width;
    ctx.font = `${font.weight} ${size}px ${font.family}`;
  }
  return size;
}

/** Pinta el nombre y el dorsal en la espalda, en px del lienzo original del kit (ctx ya escalado). */
export function stamp(ctx, kit, name, number) {
  const [W] = kit.size;
  ctx.fillStyle = kit.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (name) {
    const box = kit.name;
    const height = box.bottom - box.top;
    fitFont(ctx, NAME_FONT, name, height, W * 0.52);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(height * 0.05)}px`;
    ctx.fillText(name, box.cx, box.bottom);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  if (number) {
    const box = kit.number;
    const total = box.bottom - box.top;
    const anchorH = total * 0.11;
    const gap = total * 0.035;
    const digitH = total - anchorH - gap;
    fitFont(ctx, NUMBER_FONT, number, digitH, W * 0.5);
    const baseline = box.top + digitH;
    ctx.fillText(number, box.cx, baseline);
    // un ancla bajo cada cifra, como en la camiseta oficial
    const digits = [...number];
    const widths = digits.map((d) => ctx.measureText(d).width);
    const totalW = widths.reduce((a, b) => a + b, 0);
    const aw = anchorH * (kit.anchorImg.width / kit.anchorImg.height);
    let x = box.cx - totalW / 2;
    digits.forEach((d, i) => {
      ctx.drawImage(kit.anchorImg, x + widths[i] / 2 - aw / 2, baseline + gap, aw, anchorH);
      x += widths[i];
    });
  }
}

/** Espalda de un kit con su estampado. `k` = px de lienzo por px de la textura original (0.5 barra, 1 primer plano). */
export function backTexture(kit, name, number, k, anisotropy) {
  const [W, H] = kit.size;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * k);
  canvas.height = Math.round(H * k);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(kit.backBase ?? kit.back, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  stamp(ctx, kit, name, number);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

/** Etiqueta redonda con el número, colgada del gancho. */
export function tagTexture(number) {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = '#AAF6E6';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(12,12,10,0.35)';
  ctx.stroke();
  ctx.fillStyle = '#0C0C0A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${NUMBER_FONT.weight} ${S * 0.62}px ${NUMBER_FONT.family}`;
  ctx.fillText(String(number), S / 2, S / 2 + S * 0.04);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
