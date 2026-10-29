// Texturas de las camisetas: las fotos recortadas de cada kit y el estampado (nombre + dorsal) pintado en un canvas.
import * as THREE from 'three';
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

/** Carga las fotos de todos los kits y las anclas del dorsal. `onProgress(0..1)`. */
export async function loadKitAssets(onProgress) {
  const [anchorWhite, anchorBlack] = await Promise.all([image(`${ASSETS}brand/anchor-white.png`), image(`${ASSETS}brand/anchor-black.webp`)]);
  const keys = Object.keys(KITS);
  const kits = {};
  let done = 0;
  await Promise.all(
    keys.map(async (key) => {
      const [front, back] = await Promise.all([image(`${ASSETS}kits/${key}-front.webp`), image(`${ASSETS}kits/${key}-back.webp`)]);
      kits[key] = { ...KITS[key], key, front, back, anchorImg: KITS[key].anchor === 'white' ? anchorWhite : anchorBlack };
      onProgress?.(++done / keys.length);
    }),
  );
  return { kits };
}

export function frontTexture(kit, anisotropy) {
  const tex = new THREE.Texture(kit.front);
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
  ctx.drawImage(kit.back, 0, 0, canvas.width, canvas.height);
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
