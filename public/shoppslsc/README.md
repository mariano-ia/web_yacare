# locker/ — The Locker Room (vestuario 3D + personalizador)

Prototipo v1 del **vestuario de Port St. Lucie SC en 3D**: una barra de perchas con las camisetas del club,
una ficha por percha y un personalizador que estampa nombre y dorsal en vivo y manda al comprador a la
**tienda Shopify** con la camiseta ya en el carrito. Inspirado en "El vestuario del Huesca en 3D" de
Bellostas Studio (sdhuesca.bellostas.studio); la implementación es propia.

Como la tienda (`shop/`), es un **microsite a medida**: HTML + CSS + JS (módulos ES) con Three.js desde CDN,
sin build. **No va por bloques de WordPress** ni pasa por `tools/build-blocks.py`.

## Ver localmente

```bash
python3 -m http.server 4321        # desde la raíz del repo
# → http://localhost:4321/locker/
```

La carpeta es **autocontenida** (fuentes, escudo y anclas en `assets/`, rutas relativas): se puede servir desde
cualquier ruta o copiar entera a otro sitio. En Vercel queda en `/locker/`; la misma carpeta vive también en el
repo de Yacaré como `public/shoppslsc/` y se publica en https://yacare.io/shoppslsc/ (copia, no enlace: si se
cambia algo acá hay que volver a copiarla).

- Arrastrar o rueda: recorre la barra · pasar el cursor: la camiseta se adelanta · clic: se descuelga y abre la ficha.
- Con una abierta: arrastrar la gira, clic sobre ella la da vuelta, clic afuera o `Esc` la cuelga de nuevo.
- Teclado: flechas para recorrer, `Enter` para abrir. Móvil: la camiseta del centro hace de cursor, tocar abre; la hoja
  se cierra deslizando hacia abajo y cambia de percha hacia los lados.
- Direcciones: `?h=home-7` abre una percha; `?name=NOCETI&number=10&kit=home` abre el personalizador con ese diseño
  (es lo que se comparte con "Share design").

## Qué hay (y qué es relleno)

| Cosa | Estado |
|---|---|
| Camisetas 3D | Pecho y espalda son dos paneles abombados con las fotos de producto recortadas (`assets/kits/`), con onda de tela y retraso del bajo en el vertex shader. Para la v2 con tela simulada de verdad, ver "Pipeline de fotos". |
| Perchas | Sin plantel todavía: **números libres** (1 y 13 de arquero, 2–23 de campo, 4 de visitante) y la de **Luca (10)**. Están en `js/data.js` (`HANGERS`); cuando haya jugadores se cargan ahí con `name`, `title`, `subtitle`, `copy`. |
| Estampado | Nombre en **Druk Text Wide** y dorsal en **Druk Text Wide** con el ancla bajo cada cifra, en la posición exacta del "NAME 10" de las fotos oficiales. Cuando haya tipografía oficial de estampado se cambia en `js/jersey.js` (`NAME_FONT`, `NUMBER_FONT`). |
| Tienda | **Placeholder.** `SHOP` en `js/data.js` tiene `demo: true`: el botón "Add to cart" copia y muestra la URL que mandaría en vez de abrirla. Para conectar: poner `domain`, el `handle` de cada producto, el **ID de variante de cada talla** y el nombre de las *line item properties* del formulario de personalización, y `demo: false`. La URL es `https://<tienda>/cart/add?id=<variante>&quantity=1&properties[Name]=…&properties[Number]=…`, que en Shopify deja al comprador en su carrito con el ítem cargado. |
| Precio | `$99.99` de referencia (lo que cobraba Soccer Locker); sale de `SHOP.products`. |
| Idioma | Interfaz en inglés como el sitio; comentarios en español como el repo. |

## Pipeline de fotos (`tools/prep_kits.py`)

Las texturas salen de las fotos de producto de adidas (`tools/src/*.jpg`, 1000 px sobre blanco, frente y espalda de
cada kit). El script recorta el fondo, **borra el "NAME 10" de muestra** de la espalda (copia tela lisa de más abajo e
iguala el brillo), alinea frente y espalda en un mismo lienzo y guarda dónde iba el estampado para pintar ahí el real.

```bash
python3 -I locker/tools/prep_kits.py locker/tools/src locker/assets/kits   # necesita PIL y numpy
```

Genera `assets/kits/<kit>-{front,back}.webp`, `kits.json` (medidas; las mismas que están copiadas en `js/data.js`,
`KITS`) y `preview.png` para controlar. Para un kit nuevo: sumar sus fotos a `tools/src/`, darlo de alta en `KITS`
del script y en `js/data.js`.

## Capturas automáticas (`tools/shot.mjs`)

Abre la página en Chrome headless (WebGL por software), espera el fin del plano de entrada, recorre los estados
(barra, hover, ficha, personalizador, estampado, kit visitante, Luca, filtro) y guarda un PNG de cada uno; al final
imprime la consola del navegador. Sirve para revisar escritorio y móvil sin abrir nada.

```bash
node locker/tools/shot.mjs http://localhost:4321/locker/ /tmp/locker desktop            # todos los pasos
node locker/tools/shot.mjs http://localhost:4321/locker/ /tmp/locker mobile rail,card    # 390×844 con táctil
```

Con el renderer por software el plano de entrada tarda ~35 s en escritorio: es normal, no pasa en un dispositivo real.

## Próximos pasos

1. Tienda Shopify: producto, variantes y propiedades reales → `SHOP` (ver arriba).
2. Tipografía oficial del estampado (nombre y cifras) si la hay.
3. Plantel: una percha por jugador con ficha (y stats si se quieren) cuando se anuncie.
4. v2 de las camisetas: tela simulada en Blender a partir de las mismas fotos (ver abajo).
5. Imagen de vista previa para compartir (Open Graph) por percha y por diseño.

## v2: la camiseta "de verdad" (tela simulada)

Lo que hace real a la camiseta de la referencia (sdhuesca.bellostas.studio) no es la foto sino la **geometría**:
es una prenda simulada con el simulador de tela de Blender. En la v1 el pecho y la espalda son dos paneles
abombados con la foto pegada: no hay pliegues, las mangas quedan planas y la silueta es la del recorte.

Plan para replicarlo con lo que ya tenemos (las fotos recortadas de `assets/kits/` son el patrón):

1. **Patrón** (`tools/kit/pattern.py`, a escribir): del contorno del recorte de frente y espalda sale una malla 2D
   (triangulación con UV = la foto), con las costuras marcadas (hombros, costados) y las aberturas (cuello,
   puños, bajo). Un fuelle de ~6 cm entre delantero y espalda da el grosor del cuerpo. Python con numpy y scipy,
   o el Python que trae Blender.
2. **Simulación** (`tools/kit/sim.py`, a escribir; se corre `blender -b -P`): cose los paneles por los hombros,
   los cuelga de la percha (los hombros fijados sobre los brazos) y los deja caer sobre un **molde interior
   invisible** que crece durante los primeros fotogramas y le da cuerpo sin estirar la tela; ~170 fotogramas para
   que se asiente. Se hornea la oclusión ambiental en los colores de vértice y se exporta a `.glb` (camiseta +
   percha + gancho), uno por kit.
3. **Visor**: en `js/scene.js` los dos paneles se cambian por la malla del `.glb`. El atlas de textura y el
   estampado en canvas quedan igual (convención UV: mitad izquierda pecho, mitad derecha espalda), y se suman un
   **normal map del tejido** (punto de malla repetido) y brillo satinado (`sheen`) al material; la brisa y el
   retraso del bajo ya existen.
4. **Mangas**: de frente y de espalda la manga se ve de canto, así que el patrón se queda sin su cara exterior.
   Hace falta una foto lateral de la manga por kit (o fotografiar la camiseta real del club) para añadir esa
   franja; si no, las mangas quedan algo planas.

Requisitos: Blender 4.x (gratis; no está instalado en la Mac de trabajo, `brew install --cask blender`) y las
fotos que ya tenemos. Estimación: 2–3 días para la de campo (home y away comparten patrón, cambia la foto) y
otro día para la de arquero (manga larga: las mangas caen pegadas al cuerpo y hay que separarlas en el patrón).
El código de la referencia es público pero sin licencia: sirve de guía, el nuestro se escribe aparte.

Alternativas descartadas por ahora: comprar un modelo 3D genérico y proyectarle nuestras fotos (las UV nunca
coinciden con la foto y el estampado deja de caer donde debe), generar el 3D con IA desde la foto (sale sobre un
maniquí, topología sucia, no cuelga) y escanear una camiseta real (geometría buena, pero textura y UV fuera de
nuestro control para estampar).
