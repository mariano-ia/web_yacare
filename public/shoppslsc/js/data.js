// Datos del vestuario: kits, perchas y tienda. Lo que es relleno hasta tener la tienda Shopify está marcado con TODO.

export const SEASON = '2027';
export const CLUB = 'Port St. Lucie SC';

/** Metros por píxel de las texturas: la camiseta de campo mide 0,74 m del cuello al bajo (931 px de lienzo). */
export const METERS_PER_PX = 0.74 / 931;

/**
 * Kits. `size` es el lienzo de las texturas (assets/kits/<kit>-{front,back}.webp) y `name`/`number` dónde va el
 * estampado en la espalda, en px de ese lienzo (lo mide tools/prep_kits.py sobre el "NAME 10" de muestra de las
 * fotos de producto). `ink` es la tinta del estampado y `lining` el color del interior de la prenda.
 */
export const KITS = {
  home: {
    label: 'Home kit', group: 'HOME', size: [721, 931], ink: '#FFFFFF', lining: '#1c1c1c', anchor: 'white',
    name: { cx: 360, top: 169, bottom: 217 }, number: { cx: 361, top: 250, bottom: 443 },
  },
  away: {
    label: 'Away kit', group: 'AWAY', size: [738, 921], ink: '#0C0C0A', lining: '#d9d9d6', anchor: 'black',
    name: { cx: 366.5, top: 163, bottom: 211 }, number: { cx: 366.5, top: 244, bottom: 437 },
  },
  'gk-orange': {
    label: 'Goalkeeper kit · orange', group: 'GK', size: [703, 921], ink: '#FFFFFF', lining: '#b8491f', anchor: 'white',
    name: { cx: 349.5, top: 164, bottom: 212 }, number: { cx: 349.5, top: 245, bottom: 438 },
  },
  'gk-green': {
    label: 'Goalkeeper kit · green', group: 'GK', size: [703, 920], ink: '#0C0C0A', lining: '#3f9a4c', anchor: 'black',
    name: { cx: 349.5, top: 164, bottom: 212 }, number: { cx: 349.5, top: 245, bottom: 438 },
  },
};

export const GROUPS = [
  { key: 'GK', label: 'Goalkeepers' },
  { key: 'HOME', label: 'Home kit' },
  { key: 'AWAY', label: 'Away kit' },
];

const blank = (kit, number) => ({ id: `${kit}-${number}`, kit, group: KITS[kit].group, number, name: '' });

/**
 * Las perchas, en el orden de la barra. Todavía no hay plantel: cuelgan los números libres, esperando un nombre,
 * y la camiseta de Luca. Cuando haya jugadores, cada percha lleva `name` (lo que se estampa), `title`, `subtitle`
 * y `photo`, y la ficha los muestra.
 */
export const HANGERS = [
  blank('gk-orange', 1),
  blank('gk-green', 13),
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((n) => blank('home', n)),
  {
    id: 'luca', kit: 'home', group: 'HOME', number: 10, name: 'LUCA',
    title: 'Luca', subtitle: 'Club mascot', tag: 'Mascot',
    copy: 'The club mascot, anchored in glory. His is the first jersey on the rail; the rest are waiting for a name.',
  },
  ...[11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((n) => blank('home', n)),
  ...[2, 7, 9, 11].map((n) => blank('away', n)),
];

/**
 * Tienda oficial (Shopify). El personalizador manda al comprador a /cart/add con la camiseta ya en el carrito y el
 * nombre y el dorsal como "line item properties": el precio y el pago quedan en la tienda, acá no hay checkout.
 *
 * TODO cuando exista la tienda: `domain`, el `handle` de cada producto, el ID de la variante de cada talla y los
 * nombres de las propiedades (los que defina el formulario de personalización del producto en Shopify).
 * Mientras tanto `demo: true`: el botón de comprar muestra la URL que mandaría en vez de abrirla.
 */
export const SHOP = {
  demo: true,
  domain: 'https://pslsc.myshopify.com',
  properties: { name: 'Name', number: 'Number' },
  maxName: 12,
  maxNumber: 2,
  sizes: ['S', 'M', 'L', 'XL', '2XL'],
  products: {
    home: {
      title: 'adidas Tiro 26 match jersey · black', price: 99.99, handle: 'match-jersey-black',
      variants: { S: '1000000001', M: '1000000002', L: '1000000003', XL: '1000000004', '2XL': '1000000005' },
    },
    away: {
      title: 'adidas Tiro 26 match jersey · white', price: 99.99, handle: 'match-jersey-white',
      variants: { S: '2000000001', M: '2000000002', L: '2000000003', XL: '2000000004', '2XL': '2000000005' },
    },
    'gk-orange': {
      title: 'adidas Tiro 26 goalkeeper jersey · orange', price: 99.99, handle: 'goalkeeper-jersey-orange',
      variants: { S: '3000000001', M: '3000000002', L: '3000000003', XL: '3000000004', '2XL': '3000000005' },
    },
    'gk-green': {
      title: 'adidas Tiro 26 goalkeeper jersey · green', price: 99.99, handle: 'goalkeeper-jersey-green',
      variants: { S: '4000000001', M: '4000000002', L: '4000000003', XL: '4000000004', '2XL': '4000000005' },
    },
  },
};

export const price = (kit) => `$${SHOP.products[kit].price.toFixed(2)}`;
export const productUrl = (kit) => `${SHOP.domain}/products/${SHOP.products[kit].handle}`;

/** Deja al comprador en el carrito de la tienda con esa camiseta, talla y estampado ya cargados. */
export function cartUrl(kit, size, name, number) {
  const q = new URLSearchParams({ id: SHOP.products[kit].variants[size], quantity: '1' });
  q.set(`properties[${SHOP.properties.name}]`, name);
  q.set(`properties[${SHOP.properties.number}]`, number);
  return `${SHOP.domain}/cart/add?${q}`;
}
