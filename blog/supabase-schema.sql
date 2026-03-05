-- ═══════════════════════════════════════════════════════
-- EL PANTANO — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Authors ─────────────────────────────────────────
create table authors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  role text default '',
  bio text default '',
  avatar_initial char(1) not null default 'A',
  created_at timestamptz default now()
);

-- ─── Categories ──────────────────────────────────────
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  color text not null -- CSS class suffix: "tecnologia", "ia", "opinion", etc.
);

-- ─── Articles ────────────────────────────────────────
create table articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  excerpt text default '',
  content text default '',
  featured_image text default '',
  image_alt text default '',
  category_id uuid references categories(id) on delete set null,
  author_id uuid references authors(id) on delete set null,
  published_at timestamptz default now(),
  reading_time int default 5,
  keywords text[] default '{}',
  is_featured boolean default false,
  is_hero boolean default false,
  view_count int default 0,
  status text default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Function to atomically increment view count
create or replace function increment_view_count(article_slug text)
returns void as $$
begin
  update articles set view_count = view_count + 1 where slug = article_slug;
end;
$$ language plpgsql security definer;

-- Index for fast slug lookups
create index idx_articles_slug on articles(slug);
create index idx_articles_status on articles(status);
create index idx_articles_published_at on articles(published_at desc);
create index idx_articles_category on articles(category_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════

-- Enable RLS
alter table authors enable row level security;
alter table categories enable row level security;
alter table articles enable row level security;

-- Public can read published articles, categories, and authors
create policy "Public read authors" on authors for select using (true);
create policy "Public read categories" on categories for select using (true);
create policy "Public read published articles" on articles for select using (status = 'published');

-- Service role can do everything (used by API routes)
create policy "Service insert articles" on articles for insert with check (true);
create policy "Service update articles" on articles for update using (true);
create policy "Service delete articles" on articles for delete using (true);
create policy "Service insert authors" on authors for insert with check (true);
create policy "Service update authors" on authors for update using (true);
create policy "Service insert categories" on categories for insert with check (true);

-- ═══════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════

-- Authors
insert into authors (name, slug, role, bio, avatar_initial) values
  ('Valentina Cruz', 'valentina-cruz', 'Columnista · Opinión & Cultura',
   'Escribe sobre tecnología, trabajo y las estructuras de poder que la IA no va a cambiar sola. Periodista con 12 años de experiencia en medios digitales.', 'V'),
  ('Tomás Mendez', 'tomas-mendez', 'Editor · Tecnología',
   'Diseñador de producto obsesionado con los detalles que nadie nota. Ex-fintech, actual evangelista del buen craft digital.', 'T'),
  ('Rafa Guerrero', 'rafa-guerrero', 'Colaborador · Análisis & Negocios',
   'Analista de tecnología y estrategia. Desconfía de las tendencias y confía en los datos (cuando son buenos).', 'R'),
  ('Mia Torres', 'mia-torres', 'Colaboradora · IA & Tecnología',
   'Ingeniera de software que escribe sobre las herramientas que usa y las que descarta. Práctica por naturaleza, escéptica por elección.', 'M');

-- Categories
insert into categories (name, slug, color) values
  ('Tecnología', 'tecnologia', 'tecnologia'),
  ('Cultura', 'cultura', 'cultura'),
  ('Opinión', 'opinion', 'opinion'),
  ('IA', 'ia', 'ia'),
  ('Análisis', 'analisis', 'analisis'),
  ('Negocios', 'negocios', 'negocios');

-- Articles (seeded from current mockup content)
insert into articles (title, slug, excerpt, content, featured_image, image_alt, category_id, author_id, published_at, reading_time, keywords, is_featured, is_hero, status) values
(
  'La IA no va a robar tu trabajo. Va a hacer invisible el de tu jefe.',
  'la-ia-no-va-a-robar-tu-trabajo',
  'Cuatro años de automatización y la pirámide corporativa sigue igual. El problema no es la tecnología. Es a quién le conviene que no cambie nada.',
  '<p>En 2022 todos hablábamos de cómo el trabajo iba a cambiar para siempre. Los titulares prometían desempleo masivo, reconversión profesional y una nueva era pos-laboral. Cuatro años después, la mayoría de los trabajadores hace exactamente lo mismo que antes, solo que con más reuniones para discutir si usar o no una herramienta de IA.</p><p>El trabajo no cambió. El discurso sobre el trabajo cambió. Y esa diferencia importa.</p><h2 id="quien-decide">¿Quién decide qué se automatiza?</h2><p>Cuando una empresa adopta IA, no automatiza de forma neutra. Automatiza lo que a alguien le conviene automatizar. Y en la estructura corporativa tradicional, esa decisión la toman las personas cuyo trabajo <em>no</em> se va a automatizar.</p><p>El analista de datos que produce los informes que nadie lee: candidato a desaparecer. El director que recibe esos informes, los descarta, y toma decisiones basadas en su intuición: intocable. No porque su trabajo sea más valioso. Sino porque él contrata, evalúa, y aprueba los presupuestos.</p><p>La IA no tiene agenda política. Pero quienes la implementan sí.</p><div class="ep-pullquote"><p>La IA no tiene agenda política. Pero quienes la implementan sí. Y la primera decisión de implementación es, siempre, quién queda afuera del recorte.</p></div><h2 id="el-patron">El patrón que nadie nombra</h2><p>Mirá los casos más sonados de adopción de IA en empresas grandes. BT Group anunció que eliminaría 10.000 empleos con ayuda de IA. Goldman Sachs, IBM, Chegg. La lista crece. ¿Qué tienen en común todos estos casos?</p><p>Los puestos eliminados son casi siempre de ejecución. Los de decisión, estrategia y representación se mantienen o crecen. Las capas intermedias —las que traducen entre la dirección y la operación— son las primeras en caer.</p><p>Lo paradójico es que muchos de esos puestos intermedios existían precisamente para compensar la falta de criterio de la capa superior. Cuando la IA los reemplaza, el problema de fondo no desaparece: ahora simplemente no hay nadie que lo intercepte.</p><h2 id="el-jefe-invisible">El jefe invisible</h2><p>Hay algo más sutil que vale la pena nombrar. En muchas organizaciones, la IA está haciendo visible —por primera vez— cuánto trabajo silencioso existía.</p><p>El trabajo de coordinación informal. Las conversaciones que destrababan problemas antes de que llegaran al sistema de tickets. Los ajustes que alguien hacía porque conocía el contexto sin que nadie lo pidiera. Ese trabajo no estaba en ningún organigrama. Y cuando la empresa lo elimina junto con el rol que lo ejecutaba, se da cuenta de golpe de que algo dejó de funcionar.</p><p><strong>El jefe invisible no es el que manda. Es el que arregla lo que el que manda rompió.</strong></p><h2 id="que-hacer">¿Y entonces qué?</h2><p>No tengo una respuesta prolija. Lo que sí noto es que el debate público está mal planteado. La pregunta no es "¿va a haber trabajo en el futuro?" La pregunta es "¿quién va a capturar el valor que la IA libera?"</p><p>Si el modelo actual se mantiene, la respuesta es conocida: los accionistas, los directivos, y los que ya estaban bien. No porque sean malos. Sino porque son los que tienen el poder de decisión sobre cómo se distribuye.</p><p>La IA es una palanca enorme. La dirección en la que empuja depende de quién la sostiene.</p><hr><p style="font-size: 0.95rem; color: rgba(255,255,255,0.35); font-style: italic;"><strong style="color: rgba(255,255,255,0.5);">Valentina Cruz</strong> escribe sobre tecnología, trabajo y poder. Colabora con El Pantano desde su fundación.</p>',
  'https://picsum.photos/seed/iawork5/1440/580',
  'La IA no va a robar tu trabajo',
  (select id from categories where slug = 'opinion'),
  (select id from authors where slug = 'valentina-cruz'),
  '2026-02-23T12:00:00Z', 9,
  ARRAY['IA', 'automatización', 'trabajo', 'futuro', 'opinión'],
  true, true, 'published'
),
(
  'Por qué todas las apps de fintech se ven igual (y eso es un problema)',
  'por-que-todas-las-apps-de-fintech-se-ven-igual',
  'El design system se convirtió en la excusa para no pensar. Cuándo la coherencia visual mató la diferenciación de producto.',
  '<p>Abrí cualquier app de fintech en tu teléfono. Colores planos, bordes redondeados, tipografía inter o similar, íconos lineales, y una barra de navegación inferior con los mismos cinco items. Cambiá el logo y no sabés cuál es cuál.</p><p>Esto no es coincidencia. Es el resultado de una industria que confundió "buenas prácticas" con "copiar a Revolut".</p>',
  'https://picsum.photos/seed/fintech2026/700/525',
  'Por qué todas las apps de fintech se ven igual',
  (select id from categories where slug = 'tecnologia'),
  (select id from authors where slug = 'tomas-mendez'),
  '2026-02-20T10:00:00Z', 7,
  ARRAY['fintech', 'diseño', 'UX', 'product design'],
  true, false, 'published'
),
(
  'El modelo open source ganó. Ahora nadie sabe qué hacer con eso.',
  'el-modelo-open-source-gano',
  'Meta liberó LLaMA. Mistral existe. DeepSeek llegó y rompió todo. ¿Por qué nadie en el ecosistema parece contento?',
  '<p>Open source ganó la batalla de la IA. Meta liberó LLaMA, Mistral creó un imperio desde París, DeepSeek apareció de la nada en China y ahora todo el mundo tiene acceso a modelos que rivalizan con GPT-4.</p><p>Pero hay un problema: nadie sabe cómo ganar dinero con esto.</p>',
  'https://picsum.photos/seed/opensource7/700/525',
  'El modelo open source ganó',
  (select id from categories where slug = 'analisis'),
  (select id from authors where slug = 'rafa-guerrero'),
  '2026-02-18T14:00:00Z', 8,
  ARRAY['open source', 'LLaMA', 'Mistral', 'DeepSeek', 'IA'],
  true, false, 'published'
),
(
  'El prompt engineer murió. Bienvenidos a la era del vibe coding.',
  'el-prompt-engineer-murio',
  'El rol más hypteado de 2023 ya es un meme. Lo que viene es más interesante y más caótico.',
  '<p>En 2023, "prompt engineer" era un puesto que prometía sueldos de seis cifras y futuro garantizado. En 2026, es un chiste interno en los equipos de producto.</p>',
  'https://picsum.photos/seed/vibecode4/600/338',
  'El prompt engineer murió',
  (select id from categories where slug = 'ia'),
  (select id from authors where slug = 'mia-torres'),
  '2026-02-17T09:00:00Z', 6,
  ARRAY['IA', 'vibe coding', 'prompt engineering', 'desarrollo'],
  false, false, 'published'
),
(
  'TikTok, algoritmos, y el derecho humano a aburrirse.',
  'tiktok-algoritmos-derecho-a-aburrirse',
  'Cuando todo está optimizado para retenerte, el acto más revolucionario es no hacer nada.',
  '<p>El feed infinito no es una feature. Es un mecanismo de captura atencional diseñado para que nunca tengas un momento vacío.</p>',
  'https://picsum.photos/seed/tiktok99/600/338',
  'TikTok y el derecho a aburrirse',
  (select id from categories where slug = 'cultura'),
  (select id from authors where slug = 'valentina-cruz'),
  '2026-02-15T11:00:00Z', 5,
  ARRAY['TikTok', 'redes sociales', 'algoritmos', 'cultura digital'],
  false, false, 'published'
),
(
  'Cómo un rediseño de onboarding triplicó la retención en 8 semanas.',
  'rediseno-onboarding-retencion',
  'Un caso real de product design que demuestra que los primeros 30 segundos definen todo.',
  '<p>Cuando nos llamaron, la app tenía 40.000 descargas y un churn del 72% en la primera semana. El onboarding era un slideshow de 5 pantallas que nadie leía.</p>',
  'https://picsum.photos/seed/onboard3/600/338',
  'Rediseño de onboarding',
  (select id from categories where slug = 'negocios'),
  (select id from authors where slug = 'rafa-guerrero'),
  '2026-02-12T08:00:00Z', 6,
  ARRAY['onboarding', 'retención', 'product design', 'caso de estudio'],
  false, false, 'published'
),
(
  'Seis meses con Apple Vision Pro: lo que nadie te contó.',
  'seis-meses-con-apple-vision-pro',
  'Más allá del hype y el hate, un uso real y prolongado del dispositivo que definirá (o no) la próxima era de computing.',
  '<p>Compré el Vision Pro el día de lanzamiento. Lo usé todos los días durante seis meses. Y no, no cambió mi vida. Pero sí cambió cómo pienso sobre interfaces.</p>',
  'https://picsum.photos/seed/visionpro1/600/338',
  'Apple Vision Pro',
  (select id from categories where slug = 'tecnologia'),
  (select id from authors where slug = 'mia-torres'),
  '2026-02-10T10:00:00Z', 10,
  ARRAY['Apple', 'Vision Pro', 'XR', 'spatial computing'],
  false, false, 'published'
),
(
  'El cursor de texto parpadeante cumple 60 años. Todavía no tenemos algo mejor.',
  'cursor-parpadeante-60-anos',
  'La interfaz más ubicua del mundo digital fue inventada en 1967. Nadie la ha podido reemplazar.',
  '<p>Charles Kiesling lo inventó casi por accidente. Un rectángulo parpadeante que te dice "escribí acá". Sesenta años después, seguimos usando exactamente la misma metáfora.</p>',
  'https://picsum.photos/seed/cursor60/600/338',
  'El cursor de texto parpadeante',
  (select id from categories where slug = 'tecnologia'),
  (select id from authors where slug = 'tomas-mendez'),
  '2026-02-08T14:00:00Z', 5,
  ARRAY['historia', 'interfaces', 'UX', 'diseño'],
  false, false, 'published'
),
(
  'Cada startup de IA tiene el mismo pitch. Eso debería preocuparnos.',
  'cada-startup-ia-mismo-pitch',
  'Cuando todos prometen lo mismo, algo está mal. Un análisis de 200 pitch decks de 2025.',
  '<p>Analicé 200 pitch decks de startups de IA del último año. El 78% usa las mismas tres frases: "powered by AI", "10x productivity", y "enterprise-grade".</p>',
  'https://picsum.photos/seed/startup22/600/338',
  'Startups de IA',
  (select id from categories where slug = 'ia'),
  (select id from authors where slug = 'rafa-guerrero'),
  '2026-02-05T16:00:00Z', 7,
  ARRAY['startups', 'IA', 'venture capital', 'pitch'],
  false, false, 'published'
);
