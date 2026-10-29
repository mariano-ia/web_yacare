"""Prepara las fotos de producto de los kits de PSLSC para el vestuario 3D.

Uso: python3 -I prep_kits.py <src_dir> <out_dir>

Lee <src_dir>/<kit>-front.jpg y <kit>-back.jpg (fotos de producto sobre fondo blanco, 1000 px) y escribe:
  <out_dir>/<kit>-front.webp, <kit>-back.webp   recortes con alfa en un mismo lienzo (cuello arriba, centrados)
  <out_dir>/kits.json                            medidas del lienzo y posición del nombre y el dorsal
  <out_dir>/preview.png                          hoja de control

El "NAME 10" de muestra que trae la espalda se borra copiando tela lisa de más abajo (en mosaico espejado,
con el brillo igualado al de alrededor) y su posición se guarda para estampar ahí el nombre y el dorsal reales.
Solo usa PIL y numpy.
"""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# ink: color del estampado de muestra ('light' = blanco sobre tela oscura, 'dark' = negro sobre tela clara)
# bgmin: canal mínimo a partir del cual un píxel cuenta como fondo blanco (la camiseta blanca necesita más exigencia)
# plain_until: hasta qué fila (px de la foto) la espalda es tela lisa por debajo del dorsal (los arqueros tienen camuflaje)
KITS = {
    "home": dict(label="Home · black", ink="light", text="#FFFFFF", bgmin=244, plain_until=880),
    "away": dict(label="Away · white", ink="dark", text="#0C0C0A", bgmin=253, plain_until=880),
    "gk-orange": dict(label="Goalkeeper · orange", ink="light", text="#FFFFFF", bgmin=244, plain_until=560),
    "gk-green": dict(label="Goalkeeper · green", ink="dark", text="#0C0C0A", bgmin=244, plain_until=560),
}
TEXT_REGION = (370, 165, 630, 540)  # x0, y0, x1, y1: donde vive el "NAME 10" en las fotos de 1000 px (sin llegar a las axilas)
NECK_ZONE = (330, 0, 670, 230)  # huecos de fondo que se ven por el cuello (no conectan con el borde)
JERSEY_HEIGHT_M = 0.74  # metros del cuello al bajo de la camiseta de campo (fija la escala px→m para todos los kits)


def flood_from(mask_candidates, seeds):
    """Componente conexa (4-vecinos) de los candidatos alcanzable desde las semillas."""
    h, w = mask_candidates.shape
    out = np.zeros_like(mask_candidates)
    q = deque()
    for y, x in seeds:
        if mask_candidates[y, x] and not out[y, x]:
            out[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        if y > 0 and mask_candidates[y - 1, x] and not out[y - 1, x]:
            out[y - 1, x] = True
            q.append((y - 1, x))
        if y < h - 1 and mask_candidates[y + 1, x] and not out[y + 1, x]:
            out[y + 1, x] = True
            q.append((y + 1, x))
        if x > 0 and mask_candidates[y, x - 1] and not out[y, x - 1]:
            out[y, x - 1] = True
            q.append((y, x - 1))
        if x < w - 1 and mask_candidates[y, x + 1] and not out[y, x + 1]:
            out[y, x + 1] = True
            q.append((y, x + 1))
    return out


def background(arr, bgmin):
    """Máscara del fondo: blanco conectado al borde, más los huecos blancos que se ven por el cuello."""
    cand = arr.min(axis=2) >= bgmin
    h, w = cand.shape
    seeds = [(0, x) for x in range(0, w, 8)] + [(h - 1, x) for x in range(0, w, 8)]
    seeds += [(y, 0) for y in range(0, h, 8)] + [(y, w - 1) for y in range(0, h, 8)]
    bg = flood_from(cand, seeds)
    # huecos del cuello: candidatos no alcanzados, dentro de la zona del cuello
    x0, y0, x1, y1 = NECK_ZONE
    rest = cand & ~bg
    rest[:y0] = False
    rest[y1:] = False
    rest[:, :x0] = False
    rest[:, x1:] = False
    ys, xs = np.nonzero(rest)
    if len(ys):
        seeds = list(zip(ys[::25].tolist(), xs[::25].tolist()))
        holes = flood_from(rest, seeds)
        if holes.sum() > 150:
            bg |= holes
    return bg


def cutout(arr, bgmin):
    """RGBA con el fondo transparente, borde suavizado y sin halo blanco."""
    bg = background(arr, bgmin)
    hard = Image.fromarray(((~bg) * 255).astype(np.uint8))
    alpha = np.asarray(hard.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255.0
    rgb = arr.astype(np.float32)
    # los píxeles del borde son tela mezclada con blanco: se deshace la mezcla
    a = np.clip(alpha, 0.02, 1.0)[..., None]
    edge = (alpha > 0.02) & (alpha < 0.98)
    unmixed = np.clip((rgb - (1 - a) * 255.0) / a, 0, 255)
    rgb = np.where(edge[..., None], unmixed, rgb)
    rgba = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)
    return rgba


def ink_mask(arr, ink):
    if ink == "light":
        return arr.min(axis=2) > 190
    return arr.max(axis=2) < 100


def text_boxes(arr, ink):
    """Cajas (x0, y0, x1, y1) del nombre y del dorsal de muestra en la foto de espalda."""
    x0, y0, x1, y1 = TEXT_REGION
    m = ink_mask(arr[y0:y1, x0:x1], ink)
    rows = m.sum(axis=1) > 3
    ys = np.nonzero(rows)[0]
    if not len(ys):
        raise SystemExit("no encuentro el estampado de muestra")
    # mayor hueco entre filas con tinta: separa nombre (arriba) y dorsal (abajo)
    gaps = np.diff(ys)
    k = int(gaps.argmax())
    name_rows, num_rows = ys[: k + 1], ys[k + 1 :]

    def box(rws):
        sub = m[rws[0] : rws[-1] + 1]
        cols = np.nonzero(sub.sum(axis=0) > 1)[0]
        return [int(x0 + cols[0]), int(y0 + rws[0]), int(x0 + cols[-1] + 1), int(y0 + rws[-1] + 1)]

    return box(name_rows), box(num_rows)


def inpaint(arr, box, plain_until, pad=24, solid=16, feather=6):
    """Rellena la caja con tela lisa copiada de más abajo (mosaico espejado), igualando el brillo.

    La caja se amplía `pad` px; el relleno es total hasta `solid` px del borde ampliado (o sea, cubre los glifos
    con 8 px de margen) y se funde con la tela original solo en el anillo exterior, donde ya no hay tinta."""
    x0, y0, x1, y1 = box
    X0, Y0, X1, Y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    h, w = Y1 - Y0, X1 - X0
    sy0 = Y1 + 6
    sy1 = min(plain_until, sy0 + h)
    band = arr[sy0:sy1, X0:X1].astype(np.float32)
    tiles, rows, flip = [], 0, False
    while rows < h:
        tiles.append(band[::-1] if flip else band)
        rows += len(band)
        flip = not flip
    fill = np.concatenate(tiles)[:h]
    region = arr[Y0:Y1, X0:X1].astype(np.float32)
    ring = np.ones((h, w), bool)
    ring[pad:-pad, pad:-pad] = False
    gain = region[ring].mean(axis=0) / (band.reshape(-1, 3).mean(axis=0) + 1e-3)
    fill = np.clip(fill * gain, 0, 255)
    m = np.zeros((h, w), np.float32)
    m[solid:-solid, solid:-solid] = 1
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(feather / 2))).astype(np.float32) / 255.0
    out = arr.astype(np.float32).copy()
    out[Y0:Y1, X0:X1] = region * (1 - m[..., None]) + fill * m[..., None]
    return out.astype(np.uint8)


def bbox(rgba):
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def main(src, out):
    out.mkdir(parents=True, exist_ok=True)
    info = {"jerseyHeightM": JERSEY_HEIGHT_M, "kits": {}}
    previews = []
    scale = None
    for kit, cfg in KITS.items():
        front = np.asarray(Image.open(src / f"{kit}-front.jpg").convert("RGB"))
        back = np.asarray(Image.open(src / f"{kit}-back.jpg").convert("RGB"))
        name_box, num_box = text_boxes(back, cfg["ink"])
        union = [min(name_box[0], num_box[0]), name_box[1], max(name_box[2], num_box[2]), num_box[3]]
        back_clean = inpaint(back, union, cfg["plain_until"])
        f = cutout(front, cfg["bgmin"])
        b = cutout(back_clean, cfg["bgmin"])
        fb, bb = bbox(f), bbox(b)
        W = max(fb[2] - fb[0], bb[2] - bb[0])
        H = max(fb[3] - fb[1], bb[3] - bb[1])
        canvas_f = np.zeros((H, W, 4), np.uint8)
        canvas_b = np.zeros((H, W, 4), np.uint8)
        ofx = (W - (fb[2] - fb[0])) // 2
        obx = (W - (bb[2] - bb[0])) // 2
        canvas_f[: fb[3] - fb[1], ofx : ofx + fb[2] - fb[0]] = f[fb[1] : fb[3], fb[0] : fb[2]]
        canvas_b[: bb[3] - bb[1], obx : obx + bb[2] - bb[0]] = b[bb[1] : bb[3], bb[0] : bb[2]]
        Image.fromarray(canvas_f).save(out / f"{kit}-front.webp", quality=92, method=6)
        Image.fromarray(canvas_b).save(out / f"{kit}-back.webp", quality=92, method=6)
        if scale is None:
            scale = JERSEY_HEIGHT_M / H  # el primer kit (home) fija la escala
        shift = lambda bx: [bx[0] - bb[0] + obx, bx[1] - bb[1], bx[2] - bb[0] + obx, bx[3] - bb[1]]
        nb, db = shift(name_box), shift(num_box)
        info["kits"][kit] = {
            "label": cfg["label"],
            "size": [W, H],
            "text": cfg["text"],
            "name": {"cx": (nb[0] + nb[2]) / 2, "top": nb[1], "bottom": nb[3]},
            "number": {"cx": (db[0] + db[2]) / 2, "top": db[1], "bottom": db[3]},
        }
        previews.append((kit, canvas_f, canvas_b, nb, db))
        print(f"{kit}: lienzo {W}x{H} · nombre {nb} · dorsal {db} · fondo front {fb} back {bb}")
    info["metersPerPx"] = scale
    (out / "kits.json").write_text(json.dumps(info, indent=2))

    # hoja de control: cada kit, frente y espalda sobre gris, con las cajas del estampado
    tile = 420
    sheet = Image.new("RGB", (tile * 2 * len(previews), tile), (120, 120, 120))
    for i, (kit, cf, cb, nb, db) in enumerate(previews):
        for j, (img, boxes) in enumerate(((cf, []), (cb, [nb, db]))):
            im = Image.fromarray(img)
            k = (tile - 20) / max(im.size)
            small = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
            x = (i * 2 + j) * tile + 10
            sheet.paste(small, (x, 10), small)
            d = ImageDraw.Draw(sheet)
            for bx in boxes:
                d.rectangle([x + bx[0] * k, 10 + bx[1] * k, x + bx[2] * k, 10 + bx[3] * k], outline=(0, 255, 200), width=2)
            d.text((x + 4, tile - 16), f"{kit} {'front' if j == 0 else 'back'}", fill=(255, 255, 255))
    sheet.save(out / "preview.png")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
