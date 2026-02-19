# Yacaré Design System — Blueprint

Este Blueprint define las reglas de implementación técnica para el sistema de diseño de Yacaré. Estos lineamientos aseguran que cualquier nuevo componente o página mantenga la coherencia visual y técnica del proyecto.

## 1. Principios de Aplicación de Tokens

### Colores
- **Fondo Principal**: Siempre usar `Functional.Background.Primary` (#000000).
- **Jerarquía de Texto**:
  - Títulos y contenido crítico: `Functional.Text.Primary`.
  - Descripciones y metadatos: `Functional.Text.Secondary`.
  - Notas al pie y placeholders: `Functional.Text.Muted`.

### Tipografía
- **Titulares Hero (H1 - Home)**: Usar `h1` de tokens para el hero de la página principal.
- **Titulares Páginas Internas (H1 - Internas)**: Usar `h1-internal`. Debe ser un 20% más pequeño que el H1 principal para jerarquizar la Home.
- **Titulares Secundarios (H2-H4)**: Deben usar la familia `Phosphate` (o su alias `Antonio`) en mayúsculas.
- **Cuerpo de Texto**: Usar `Figtree` para párrafos y lectura general.

---

## 2. Especificación de Componentes

### Botones (`class="btn"`)
Todos los botones deben ser `rounded-full` (píldora) y tener una transición suave obligatoria de 0.3s para todos los estados de hover. Esto asegura una experiencia premium y sin parpadeos.

- **Primario (`.btn--primary`)**: 
  - Estado Inicial: Fondo Blanco, Texto Negro.
  - Hover: Fondo Negro, Texto Blanco, Borde Blanco.
- **Secundario (`.btn--secondary`)**:
  - Estado Inicial: Fondo Transparente, Texto Blanco, Borde Blanco.
  - Hover: Fondo Blanco, Texto Negro, Borde Blanco.

### Cards (`class="card"`)
- Estilo "Bento Box" con `border-radius: 32px`.
- Fondo mate `#0A0A0A`.
- Hover: Elevación sutil (`translateY: -8px`) y cambio de color de borde a blanco suave.

### Chips (`class="chip"`)
Usar para metadatos, categorías o estados.
- **Estilo Base**: Texto blanco (`Functional.Text.Primary`), fondo sutil (transparencia 5%) y borde fino.
- **Estilo Resaltado (Orange Outline)**: Usado para servicios y estados críticos. Texto y borde en `Color.Orange` (#FF8A00), fondo transparente.
- **Uso**: Agrupar en `.chip-group` para metadatos múltiples.

### Inputs (`class="form__input"`)
- Fondo: `Functional.Background.Secondary`.
- Border-radius: `12px` (Radius MD).
- Focus: El borde debe cambiar al color `Accent.Primary` (#8A5EFF).

---

## 3. Estructura de Layout
- **Contenedores**: 
  - Ancho máximo estándar: `1440px`.
  - Padding lateral: `32px` por defecto.
- **Secciones**: Padding vertical estándar basado en `--space-8` (120px) para dar "aire" al diseño minimalista.
