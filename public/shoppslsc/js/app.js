// La interfaz sobre la escena: ficha, personalizador, filtros, dirección y teclado.
import { CLUB, GROUPS, HANGERS, KITS, SHOP, cartUrl, price, productUrl } from './data.js';
import { LockerRoom } from './scene.js';
import { cleanName, cleanNumber, loadKitAssets } from './jersey.js';

const $ = (sel) => document.querySelector(sel);
const app = $('#app');
const canvas = $('#stage');
const loader = $('#loader');
const bar = $('#loader-bar');
const card = $('#card');
const caption = $('#caption');
const labels = $('#labels');
const header = $('#header');
const footer = $('#footer');
const form = $('#custom-form');
const nameInput = $('#cu-name');
const numInput = $('#cu-num');
const buy = $('#cu-buy');
const groupEls = new Map([...document.querySelectorAll('[data-group]')].map((el) => [el.dataset.group, el]));
const touch = matchMedia('(hover: none)').matches;
const HOME_TITLE = document.title;
const byId = new Map(HANGERS.map((h) => [h.id, h]));
const groupLabel = (key) => GROUPS.find((g) => g.key === key)?.label ?? key;
if (touch) $('#hint').textContent = 'Swipe the rail · Tap a jersey';

// ---------------------------------------------------------------- ficha
const fillCard = (h) => {
  $('#card-kit').textContent = KITS[h.kit].label;
  $('#card-group').textContent = h.tag ?? (h.name ? groupLabel(h.group) : 'Founders Edition');
  $('#card-num').textContent = String(h.number);
  $('#card-title').textContent = h.title ?? 'Your name here';
  $('#card-sub').textContent = h.subtitle ?? `No. ${h.number} is still unclaimed`;
  $('#card-product').textContent = SHOP.products[h.kit].title;
  $('#card-price').textContent = price(h.kit);
  $('#card-copy').textContent =
    h.copy ??
    'The first locker room in club history, hung before the first game is played. Pick a number, put your name on it, and it ships from the official store with the print already on.';
};

// ------------------------------------------------- dirección de cada vista
// Sitio estático: la vista va en la query. ?h=<percha> abre una percha; ?name=…&number=…&kit=… el personalizador.
/** Lo que hay abierto: una percha, el personalizador ('custom') o nada */
const field = (name) => new FormData(form).get(name);
const pathFor = (t) => {
  const q = new URLSearchParams();
  if (t === 'custom') {
    if (nameInput.value) q.set('name', nameInput.value);
    if (numInput.value) q.set('number', numInput.value);
    q.set('kit', field('kit'));
  } else if (t) q.set('h', t.id);
  const s = q.toString();
  return location.pathname + (s ? `?${s}` : '');
};
const fromPath = () => {
  const q = new URLSearchParams(location.search);
  if (q.has('name') || q.has('number') || q.has('kit')) return 'custom';
  return byId.get(q.get('h')) ?? null;
};
const titleFor = (t) =>
  t === 'custom' ? `Make it yours · ${CLUB} locker room` : t ? `No. ${t.number} · ${KITS[t.kit].label} · ${CLUB} locker room` : HOME_TITLE;
let current = null;
let fromHistory = false;

const toast = (text) => {
  const el = $('#toast');
  el.textContent = text;
  el.style.opacity = '1';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.style.opacity = '0'), 2200);
};
const share = async (url, text) => {
  try {
    if (navigator.share) await navigator.share({ title: document.title, text, url });
    else {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    }
  } catch (err) {
    if (err.name !== 'AbortError') toast('Could not share');
  }
};

// las camisetas se estampan en un canvas: hay que esperar a las tipografías
await Promise.all([
  document.fonts.load('800 64px "Druk"'),
  document.fonts.load('800 32px "Druk Text Wide"'),
  document.fonts.load('700 16px "Proxima Nova"'),
  document.fonts.load('800 32px "Ferryman"'),
]).catch(() => {});
bar.style.width = '25%';

// hoja compacta o con todos los datos (móvil en vertical)
const setMore = (on) => {
  if (card.dataset.more === String(on)) return;
  card.dataset.more = String(on);
  $('#card-more').setAttribute('aria-expanded', String(on));
  requestAnimationFrame(fitStage);
};

// hueco que dejan cabecera, ficha y pie: ahí se encaja la camiseta abierta
const fitStage = () => {
  if (!locker) return;
  const w = innerWidth, h = innerHeight;
  const top = (header.getBoundingClientRect().bottom + 6) / h;
  locker.stageRect = matchMedia('(min-width: 900px) and (orientation: landscape)').matches
    ? { x0: 0, y0: top, x1: card.offsetLeft / w, y1: (footer.offsetTop + 28) / h, tuck: 0 }
    : { x0: 0, y0: top, x1: 1, y1: card.offsetTop / h, tuck: 0.2 };
};

let locker;
try {
  const assets = await loadKitAssets((p) => (bar.style.width = `${25 + p * 50}%`));
  locker = new LockerRoom(canvas, HANGERS, assets, {
    onHover(h) {
      caption.style.opacity = h ? '1' : '0';
      if (!h) return;
      $('#cap-num').textContent = String(h.number);
      $('#cap-name').textContent = h.title ?? 'Your name here';
      $('#cap-meta').textContent = `${KITS[h.kit].label} · ${h.name ? h.subtitle : 'unclaimed'}`;
    },
    onSelect(h) {
      const target = h ? (h.id === 'custom' ? 'custom' : h) : null;
      if (!target) setMore(false);
      card.dataset.open = String(!!target);
      card.inert = !target;
      card.dataset.view = target === 'custom' ? 'custom' : 'hanger';
      app.dataset.card = target ? 'open' : '';
      if (target && target !== 'custom') fillCard(target);
      requestAnimationFrame(fitStage);
      $('#hint').style.opacity = '0';
      // la dirección sigue a lo abierto: abrir y cerrar entran en el historial, pasar de percha no
      if (!fromHistory && location.pathname + location.search !== pathFor(target)) {
        history[current && target ? 'replaceState' : 'pushState'](null, '', pathFor(target));
      }
      document.title = titleFor(target);
      current = target;
    },
    onFrame({ groups, caption: cap, stage }) {
      labels.style.opacity = stage ? '0' : '1';
      for (const [key, el] of groupEls) {
        const g = groups.find((g) => g.key === key);
        el.style.opacity = g?.visible ? '1' : '0';
        if (g) el.style.transform = `translate3d(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px, 0) translateY(-100%)`;
      }
      if (cap) caption.style.transform = `translate3d(${cap.x.toFixed(1)}px, ${cap.y.toFixed(1)}px, 0) translateX(-50%)`;
    },
    onIntroEnd() {
      app.dataset.ready = 'true';
      const deep = fromPath();
      if (deep) open(deep, true);
    },
  });
  window.locker = locker; // para probar desde la consola (y las capturas automáticas)
} catch (err) {
  console.error(err);
  $('#fallback').hidden = false;
}
bar.style.width = '100%';
loader.dataset.done = 'true';
fitStage();
addEventListener('resize', fitStage);
// la escena ocupa justo la pantalla; si algo la desplazara (un foco, un ancla), vuelve a su sitio
app.addEventListener('scroll', () => app.scrollTo(0, 0));

const filters = [...document.querySelectorAll('[data-filter]')];
const setFilter = (group) => {
  locker?.setFilter(group);
  for (const b of filters) {
    const on = (b.dataset.filter || null) === group;
    b.setAttribute('aria-pressed', String(on));
    const row = b.parentElement;
    if (on && row.scrollWidth > row.clientWidth) {
      const r = b.getBoundingClientRect(), box = row.getBoundingClientRect();
      row.scrollTo({ left: row.scrollLeft + r.left - box.left - (box.width - r.width) / 2, behavior: 'smooth' });
    }
  }
};

/** Abre una percha o el personalizador (o cierra con null), venga de un toque, de un botón o de la dirección */
function open(t, history = false) {
  if (!locker) return;
  const active = filters.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.filter;
  if (t && t !== 'custom' && active && active !== t.group) setFilter(null);
  fromHistory = history;
  locker.select(t === 'custom' ? 'custom' : (t?.id ?? null));
  fromHistory = false;
}

if (locker) {
  const room = locker;
  // quien llega con un enlace directo no espera al plano de entrada completo
  if (fromPath()) setTimeout(() => room.skipIntro(), 500);
  addEventListener('popstate', () => open(fromPath(), true));

  for (const btn of filters) {
    btn.addEventListener('click', () => {
      room.select(null);
      setFilter(btn.dataset.filter || null);
    });
  }
  $('#card-close').addEventListener('click', () => room.select(null));
  $('#card-more').addEventListener('click', () => setMore(card.dataset.more !== 'true'));
  $('#card-grip').addEventListener('click', () => current !== 'custom' && setMore(card.dataset.more !== 'true'));
  $('#card-prev').addEventListener('click', () => room.step(-1));
  $('#card-next').addEventListener('click', () => room.step(1));
  $('#card-share').addEventListener('click', () => {
    if (current && current !== 'custom') {
      share(location.origin + pathFor(current), `No. ${current.number} in the ${CLUB} locker room`);
    }
  });

  // la hoja en móvil: deslizar abajo la cierra; a los lados pasa de percha
  let swipe = null;
  card.addEventListener('touchstart', (e) => {
    swipe = e.target.closest('input, a, button, label') ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  card.addEventListener('touchend', (e) => {
    if (!swipe) return;
    const dx = e.changedTouches[0].clientX - swipe.x, dy = e.changedTouches[0].clientY - swipe.y;
    swipe = null;
    if (dy < -50 && -dy > Math.abs(dx) * 1.5 && current !== 'custom') setMore(true);
    else if (dy > 70 && dy > Math.abs(dx) * 1.5) card.dataset.more === 'true' ? setMore(false) : room.select(null);
    else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && current !== 'custom') room.step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // -------------------------------------------------------- personalizador
  let stamp = 0;
  const syncCustom = () => {
    nameInput.value = cleanName(nameInput.value);
    numInput.value = cleanNumber(numInput.value);
    const name = nameInput.value.trim(), number = numInput.value, kit = field('kit'), size = field('size');
    const ready = !!name && !!number;
    buy.setAttribute('aria-disabled', String(!ready));
    buy.dataset.url = ready ? cartUrl(kit, size, name, number) : '';
    if (ready && !SHOP.demo) buy.href = buy.dataset.url;
    else buy.removeAttribute('href');
    $('#cu-price').textContent = price(kit);
    $('#cu-product').href = productUrl(kit);
    $('#cu-demo').hidden = !(SHOP.demo && ready);
    $('#cu-demo-url').textContent = buy.dataset.url;
    // estampar es caro: se espera a que deje de teclear un instante
    clearTimeout(stamp);
    stamp = window.setTimeout(() => {
      room.setCustom(kit, name || 'YOUR NAME', number || '10');
      if (current === 'custom') history.replaceState(null, '', pathFor('custom'));
    }, 110);
  };
  form.addEventListener('input', syncCustom);
  form.addEventListener('submit', (e) => e.preventDefault());
  nameInput.addEventListener('keydown', (e) => e.key === 'Enter' && numInput.focus());
  numInput.addEventListener('keydown', (e) => e.key === 'Enter' && numInput.blur());
  buy.addEventListener('click', (e) => {
    if (buy.getAttribute('aria-disabled') === 'true') return e.preventDefault();
    if (!SHOP.demo) return;
    e.preventDefault();
    navigator.clipboard?.writeText(buy.dataset.url).catch(() => {});
    toast('Demo: the store is not connected yet. The cart link was copied.');
  });
  const openCustom = (prefill) => {
    room.skipIntro();
    if (prefill) {
      if (!numInput.value) numInput.value = String(prefill.number);
      const kit = form.querySelector(`input[name="kit"][value="${prefill.kit}"]`);
      if (kit) kit.checked = true;
    }
    syncCustom();
    open('custom');
    if (!touch) setTimeout(() => nameInput.focus(), 350);
  };
  for (const btn of document.querySelectorAll('[data-customize]')) btn.addEventListener('click', () => openCustom());
  $('#card-custom').addEventListener('click', () => openCustom(current && current !== 'custom' ? current : undefined));
  $('#cu-share').addEventListener('click', () => share(location.origin + pathFor('custom'), `My ${CLUB} jersey`));
  $('#cu-back').addEventListener('click', () => room.select(null));
  // un enlace compartido trae el diseño en la dirección
  const q = new URLSearchParams(location.search);
  nameInput.value = cleanName(q.get('name') ?? '');
  numInput.value = cleanNumber(q.get('number') ?? '');
  const kitFromQuery = form.querySelector(`input[name="kit"][value="${q.get('kit')}"]`);
  if (kitFromQuery) kitFromQuery.checked = true;
  syncCustom();

  // ------------------------------------------------------------- teclado
  canvas.addEventListener('pointermove', () => (room.kbd = false));
  addEventListener('keydown', (e) => {
    if (!room.ready) return room.skipIntro();
    // escribiendo en el personalizador las teclas son del texto, salvo Escape
    if (e.target.closest?.('input')) {
      if (e.key === 'Escape') room.select(null);
      return;
    }
    if (e.key === 'Escape') room.select(null);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      room.kbd = true;
      room.step(e.key === 'ArrowRight' ? 1 : -1);
    } else if (e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') room.openHovered();
  });
}
