#!/usr/bin/env node
/**
 * Yacaré blog — bilingual SEO article generator (no DB, no images).
 *
 * Drains the topic queue in config.json. For each topic it generates a Spanish
 * article with Claude (structured JSON), adapts it to English, renders both
 * through template.html into elpantano/<slug>.html and elpantano/en/<slug>.html,
 * then rebuilds the ES + EN hubs, the home "Blog" strip and sitemap.xml.
 *
 * Usage:
 *   node seo-pipeline/generate.mjs                 # all pending
 *   node seo-pipeline/generate.mjs --limit 1       # first N pending
 *   node seo-pipeline/generate.mjs --slug <slug>   # (re)generate one
 *   node seo-pipeline/generate.mjs --dry-run       # call API, write nothing
 *   node seo-pipeline/generate.mjs --listings-only # rebuild hubs/home/sitemap (no API)
 *   node seo-pipeline/generate.mjs --model <id>    # override model
 *
 * Needs ANTHROPIC_API_KEY in the environment or in Yacare/.env.local.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const PIPELINE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.dirname(PIPELINE_DIR);
const ELPANTANO_DIR = path.join(ROOT_DIR, "elpantano");
const EN_DIR = path.join(ELPANTANO_DIR, "en");
const CONFIG_PATH = path.join(PIPELINE_DIR, "config.json");
const AUTHORS_PATH = path.join(PIPELINE_DIR, "authors.json");
const TEMPLATE_PATH = path.join(PIPELINE_DIR, "template.html");
const HUB_TEMPLATE_PATH = path.join(PIPELINE_DIR, "template-hub.html");
const SITEMAP_PATH = path.join(ROOT_DIR, "sitemap.xml");
const HOME_PATH = path.join(ROOT_DIR, "index.html");

const SITE = "https://yacare.io";
const OG_IMAGE = `${SITE}/og-image.jpg`;
const LANGS = ["es", "en"];

const MONTHS = {
  es: ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};
const MONTHS_SHORT = {
  es: ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
};
const CAT_EN = { tecnologia: "Technology", cultura: "Culture", opinion: "Opinion", ia: "AI", analisis: "Analysis", negocios: "Business" };

const STR = {
  es: {
    titleSuffix: " · Blog de Yacaré", hubTitle: "Blog de Yacaré", ogLocale: "es_AR",
    search: "Buscar", menu: "Menú", close: "Cerrar", searchPh: "Buscar en el blog…", searchHint: "ESC para cerrar",
    breadcrumb: "Ubicación", share: "Compartir artículo", readmin: "min de lectura",
    tocHead: "En este artículo", back: "Volver al blog", more: "Más del blog", faqTitle: "Preguntas frecuentes",
    ctaPrefix: "Conocé",
    hubTagline: "Ideas sobre producto, inteligencia artificial y negocios para startups y pymes.",
    footerTagline: "El blog de Yacaré. Ideas sobre producto, IA y negocios para quienes construyen.",
    fSections: "Secciones", fAbout: "Nosotros", fServices: "Servicios", fWork: "Trabajos", fConnect: "Conectar",
    fContact: "Contacto", fPrivacy: "Privacidad", fTerms: "Términos", fBy: "Un blog de",
    langSwitch: "English",
  },
  en: {
    titleSuffix: " · Yacaré Blog", hubTitle: "Yacaré Blog", ogLocale: "en_US",
    search: "Search", menu: "Menu", close: "Close", searchPh: "Search the blog…", searchHint: "ESC to close",
    breadcrumb: "Breadcrumb", share: "Share article", readmin: "min read",
    tocHead: "In this article", back: "Back to the blog", more: "More from the blog", faqTitle: "Frequently asked questions",
    ctaPrefix: "Explore",
    hubTagline: "Ideas on product, artificial intelligence and business for startups and SMBs.",
    footerTagline: "Yacaré's blog. Ideas on product, AI and business for people who build.",
    fSections: "Sections", fAbout: "About", fServices: "Services", fWork: "Work", fConnect: "Connect",
    fContact: "Contact", fPrivacy: "Privacy", fTerms: "Terms", fBy: "A blog by",
    langSwitch: "Español",
  },
};

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const LIMIT = opt("--limit") ? parseInt(opt("--limit"), 10) : Infinity;
const ONLY_SLUG = opt("--slug");
const DRY_RUN = flag("--dry-run");
const LISTINGS_ONLY = flag("--listings-only");
const MODEL_OVERRIDE = opt("--model");

// ── io ──────────────────────────────────────────────────────────────────────
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + "\n");
const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

function loadApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of read(envPath).split("\n")) {
      const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+)\s*$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  console.error("ERROR: ANTHROPIC_API_KEY not found (env or Yacare/.env.local)");
  process.exit(1);
}

// ── text ────────────────────────────────────────────────────────────────────
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = (s = "") => esc(s).replace(/\n/g, " ").trim();

function mdInline(text = "") {
  let out = esc(text);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const ok = /^(https:\/\/yacare\.io|\/)/.test(href.trim());
    return ok ? `<a href="${attr(href)}">${label}</a>` : label;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

const fmtDate = (lang, iso) => { const [y, m, d] = iso.split("-").map(Number); return lang === "es" ? `${d} de ${MONTHS.es[m - 1]}, ${y}` : `${MONTHS.en[m - 1]} ${d}, ${y}`; };
const fmtDateShort = (lang, iso) => { const [y, m, d] = iso.split("-").map(Number); return lang === "es" ? `${d} ${MONTHS_SHORT.es[m - 1]} ${y}` : `${MONTHS_SHORT.en[m - 1]} ${d}, ${y}`; };
const todayISO = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };

const hubUrl = (lang) => (lang === "es" ? "/elpantano/" : "/elpantano/en/");
const artUrl = (lang, slug) => (lang === "es" ? `/elpantano/${slug}.html` : `/elpantano/en/${slug}.html`);
const artPath = (lang, slug) => (lang === "es" ? path.join(ELPANTANO_DIR, `${slug}.html`) : path.join(EN_DIR, `${slug}.html`));
const catName = (lang, key) => (lang === "es" ? CATEGORIES[key] : CAT_EN[key]);

function navCats(lang) {
  const u = hubUrl(lang);
  return Object.keys(CATEGORIES)
    .map((k) => `                <a href="${u}" class="ep-nav__cat ep-nav__cat--${k}">${esc(catName(lang, k))}</a>`)
    .join("\n");
}
function footerCats(lang) {
  const u = hubUrl(lang);
  return Object.keys(CATEGORIES).slice(0, 5)
    .map((k) => `                    <a href="${u}" class="ep-footer__link">${esc(catName(lang, k))}</a>`)
    .join("\n");
}

function hreflangBlock(slug, langsAvail) {
  const lines = [];
  for (const l of LANGS) if (langsAvail.includes(l)) lines.push(`    <link rel="alternate" hreflang="${l}" href="${SITE}${artUrl(l, slug)}">`);
  if (langsAvail.includes("es")) lines.push(`    <link rel="alternate" hreflang="x-default" href="${SITE}${artUrl("es", slug)}">`);
  return lines.join("\n");
}
function hubHreflang() {
  return [
    `    <link rel="alternate" hreflang="es" href="${SITE}${hubUrl("es")}">`,
    `    <link rel="alternate" hreflang="en" href="${SITE}${hubUrl("en")}">`,
    `    <link rel="alternate" hreflang="x-default" href="${SITE}${hubUrl("es")}">`,
  ].join("\n");
}

function replaceRegion(html, marker, content) {
  const re = new RegExp(`<!-- ep:${marker}:start -->[\\s\\S]*?<!-- ep:${marker}:end -->`);
  if (!re.test(html)) { console.warn(`  [warn] markers ep:${marker} not found`); return html; }
  return html.replace(re, `<!-- ep:${marker}:start -->\n${content}\n          <!-- ep:${marker}:end -->`);
}

// ── Claude ──────────────────────────────────────────────────────────────────
const ARTICLE_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: "string" }, standfirst: { type: "string" }, meta_description: { type: "string" },
    breadcrumb_title: { type: "string" }, reading_time: { type: "integer" },
    sections: {
      type: "array",
      items: { type: "object", additionalProperties: false,
        properties: { id: { type: "string" }, heading: { type: "string" }, paragraphs: { type: "array", items: { type: "string" } }, pullquote: { type: "string" } },
        required: ["id", "heading", "paragraphs", "pullquote"] },
    },
    faq: { type: "array", items: { type: "object", additionalProperties: false, properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } },
    cta_text: { type: "string" },
  },
  required: ["title", "standfirst", "meta_description", "breadcrumb_title", "reading_time", "sections", "faq", "cta_text"],
};

function systemPromptES() {
  return `Sos editor del blog de Yacaré (estudio de producto digital). Escribís artículos en español neutro rioplatense para fundadores de startups y dueños de pymes que quieren aplicar inteligencia artificial en sus proyectos. Tono profesional pero accesible: claro, concreto, sin jerga innecesaria, sin hype. Nada de promesas infladas.

REGLAS DE ESTILO (obligatorias):
- NUNCA uses guiones (—, –, ni "-" como signo de puntuación). Usá comas, puntos, dos puntos o paréntesis. Regla absoluta.
- Párrafos de 2 a 4 oraciones. Voz activa. Honestidad por encima del marketing: nombrá límites y cuándo algo NO conviene.

ESTRUCTURA:
- 900 a 1400 palabras de cuerpo. 4 a 6 secciones, cada una con heading (H2) y un id en kebab-case sin acentos.
- La primera sección es la introducción. 1 o 2 pullquotes en total (campo pullquote; "" donde no haya).
- Enlaces internos en markdown [texto](/url) usando SOLO las URLs candidatas que te paso, 2 a 4 veces, con al menos uno al servicio de Yacaré indicado.
- faq: 3 a 4 preguntas con respuestas de 2 a 4 oraciones.
- cta_text: una sola oración que invite a trabajar con Yacaré en el servicio indicado, sin guiones.
- Párrafos como strings con markdown mínimo permitido: [texto](/url), **negrita**, *cursiva*.
- title: menos de 60 caracteres (para que no se corte en Google), con la keyword principal al inicio.
- breadcrumb_title: versión corta (menos de 50 caracteres). meta_description: 140 a 160 caracteres, sin guiones. reading_time: entero.

Calidad antes que volumen.`;
}

function userPromptES(topic, published) {
  const service = SERVICES[topic.service];
  const links = [
    `- ${service.name} (servicio de Yacaré a enlazar): ${service.url} — ${service.pitch}`,
    ...published.slice(0, 12).map((p) => `- ${p.title.es}: ${SITE}/elpantano/${p.slug}.html`),
  ].join("\n");
  return `Escribí el artículo para el blog de Yacaré.

TÍTULO ORIENTATIVO (podés mejorarlo): ${topic.title_hint}
CATEGORÍA: ${topic.category}
ÁNGULO: ${topic.angle}
KEYWORDS A CUBRIR: ${(topic.keywords || []).join(", ")}

URLs CANDIDATAS PARA ENLACES INTERNOS (usá solo estas, en markdown):
${links}

Devolvé únicamente el objeto JSON con el formato requerido, sin texto adicional ni bloques de código.`;
}

function translatePrompt(articleEs) {
  return `You are adapting an article for Yacaré's blog from Spanish to natural US English. Same audience: startup founders and SMB owners applying AI. Keep the SAME JSON structure and the SAME section ids. Keep every markdown link and its URL EXACTLY as they are. Never use dashes (—, –, or "-" as punctuation): use commas, periods, colons or parentheses. Keep meta_description between 140 and 160 characters. Return only the JSON object, no extra text or code fences.

SPANISH ARTICLE JSON:
${JSON.stringify(articleEs)}`;
}

function parseLoose(s) {
  let t = (s || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch { /* */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error("could not parse JSON from model output");
}

async function callJson(client, model, system, user) {
  const msg = await client.messages.create({
    model, max_tokens: 16000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema: ARTICLE_SCHEMA } },
  });
  const block = msg.content.find((b) => b.type === "text");
  if (!block) throw new Error("no text block in response");
  return parseLoose(block.text);
}

// Rewrite cross-article internal links to the English path for EN rendering.
function localizeEnLinks(article) {
  const fix = (s) => s.replace(/\/elpantano\/(?!en\/)([^")\s]+\.html)/g, "/elpantano/en/$1");
  return {
    ...article,
    sections: article.sections.map((sec) => ({ ...sec, paragraphs: sec.paragraphs.map(fix) })),
    cta_text: fix(article.cta_text),
    faq: article.faq.map((f) => ({ ...f, a: fix(f.a) })),
  };
}

// ── rendering ───────────────────────────────────────────────────────────────
function renderProse(lang, article, service) {
  const t = STR[lang];
  const parts = [];
  for (const s of article.sections) {
    if (s.heading) parts.push(`                    <h2 id="${attr(s.id)}">${esc(s.heading)}</h2>`);
    for (const p of s.paragraphs) parts.push(`                    <p>${mdInline(p)}</p>`);
    if (s.pullquote && s.pullquote.trim()) parts.push(`                    <div class="ep-pullquote"><p>${esc(s.pullquote)}</p></div>`);
  }
  parts.push(`                    <div class="ep-prose-cta" style="margin: var(--space-6) 0; padding: var(--space-5); border: 1px solid var(--border-medium); border-radius: var(--radius-md); background: var(--gradient-card, rgba(255,255,255,0.03));">
                        <p style="margin: 0 0 var(--space-3); font-weight: 600; color: var(--text-primary, #fff);">${esc(article.cta_text)}</p>
                        <a href="${service.url}" style="display: inline-block; padding: 0.7rem 1.4rem; border-radius: var(--radius-pill, 9999px); background: var(--accent-primary, #8A5EFF); color: #fff; font-weight: 600; text-decoration: none;">${esc(t.ctaPrefix)} ${esc(service.name)} &rarr;</a>
                    </div>`);
  if (article.faq && article.faq.length) {
    parts.push(`                    <h2 id="preguntas-frecuentes">${esc(t.faqTitle)}</h2>`);
    for (const f of article.faq) {
      parts.push(`                    <details class="ep-faq__item" style="border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.1)); padding: var(--space-3) 0;">
                        <summary style="cursor: pointer; font-weight: 600;">${esc(f.q)}</summary>
                        <p>${mdInline(f.a)}</p>
                    </details>`);
    }
  }
  return parts.join("\n");
}

function renderToc(lang, article) {
  const items = article.sections.filter((s) => s.heading).map((s) => `                        <li><a href="#${attr(s.id)}">${esc(s.heading)}</a></li>`);
  if (article.faq && article.faq.length) items.push(`                        <li><a href="#preguntas-frecuentes">${esc(STR[lang].faqTitle)}</a></li>`);
  return items.join("\n");
}

function cardHtml(lang, entry, { heading = "h3" } = {}) {
  const a = AUTHORS[entry.author] || { name: entry.author, initial: "?" };
  return `                <a href="${artUrl(lang, entry.slug)}" class="ep-card ep-card--standard" style="display:block; padding: var(--space-4, 24px); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius: var(--radius-md, 12px); text-decoration:none;">
                    <div class="ep-card__cat"><span class="ep-cat ep-cat--${entry.category}">${esc(catName(lang, entry.category))}</span></div>
                    <${heading} class="ep-card__title" style="margin: .6rem 0;">${esc(entry.title[lang])}</${heading}>
                    <p class="ep-card__excerpt" style="opacity:.6; font-size:.95rem; margin:0 0 .8rem;">${esc(entry.standfirst[lang])}</p>
                    <div class="ep-card__meta">
                        <div class="ep-card__author-row">
                            <div class="ep-card__author-thumb" aria-hidden="true">${esc(a.initial)}</div>
                            <span class="ep-card__author-name">${esc(a.name)}</span>
                        </div>
                        <span class="ep-card__dot" aria-hidden="true"></span>
                        <span class="ep-card__date">${fmtDateShort(lang, entry.date)}</span>
                    </div>
                </a>`;
}

function heroHtml(lang, entry) {
  const a = AUTHORS[entry.author] || { name: entry.author, initial: "?" };
  return `            <a href="${artUrl(lang, entry.slug)}" style="display:block; padding: var(--space-6, 48px); border:1px solid var(--border-medium, rgba(255,255,255,0.2)); border-radius: var(--radius-lg, 24px); background: var(--gradient-card, rgba(255,255,255,0.03)); text-decoration:none;">
                <div style="margin-bottom: var(--space-3, 16px);"><span class="ep-cat ep-cat--${entry.category}">${esc(catName(lang, entry.category))}</span></div>
                <h2 style="font-size: var(--fs-h3, 2rem); line-height:1.1; margin:0 0 var(--space-3, 16px); color: var(--text-primary, #fff);">${esc(entry.title[lang])}</h2>
                <p style="opacity:.7; max-width:60ch; margin:0 0 var(--space-4, 24px);">${esc(entry.standfirst[lang])}</p>
                <div style="font-size:.85rem; opacity:.55;">${esc(a.name)} · ${fmtDateShort(lang, entry.date)} · ${entry.reading_time} ${esc(STR[lang].readmin)}</div>
            </a>`;
}

function homeCardHtml(entry) {
  return `          <a href="${artUrl("es", entry.slug)}" class="pantano-card" style="display:block; padding: var(--space-4, 24px); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius: var(--radius-md, 12px); text-decoration:none;">
            <span style="font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; opacity:.6;">${esc(catName("es", entry.category))}</span>
            <h3 style="font-size:1.05rem; line-height:1.25; margin:.5rem 0 .75rem; color:var(--text-primary,#fff);">${esc(entry.title.es)}</h3>
            <span style="font-size:.8rem; opacity:.55;">${fmtDateShort("es", entry.date)}</span>
          </a>`;
}

function buildJsonLd(lang, article, entry, author) {
  const url = `${SITE}${artUrl(lang, entry.slug)}`;
  const blocks = [
    { "@context": "https://schema.org", "@type": "Article", inLanguage: lang, headline: article.title, description: article.meta_description, image: OG_IMAGE, author: { "@type": "Person", name: author.name }, publisher: { "@type": "Organization", name: "Yacaré", url: SITE }, datePublished: entry.date, dateModified: entry.date, articleSection: catName(lang, entry.category), mainEntityOfPage: { "@type": "WebPage", "@id": url } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE}${hubUrl(lang)}` },
      { "@type": "ListItem", position: 2, name: catName(lang, entry.category), item: `${SITE}${hubUrl(lang)}` },
      { "@type": "ListItem", position: 3, name: article.breadcrumb_title, item: url } ] },
  ];
  if (article.faq && article.faq.length) blocks.push({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang, mainEntity: article.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  return blocks.map((b) => `    <script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n    </script>`).join("\n");
}

function renderArticlePage(lang, template, article, entry, author, related, langsAvail) {
  const t = STR[lang];
  const service = SERVICES[entry.service] || { name: "Yacaré", url: "/" };
  const relCards = related.length ? related.map((p) => cardHtml(lang, p)).join("\n\n") : "                <!-- no related yet -->";
  const repl = {
    LANG: lang, TITLE_SUFFIX: t.titleSuffix,
    TITLE: esc(article.title), META_DESCRIPTION: attr(article.meta_description),
    CANONICAL: `${SITE}${artUrl(lang, entry.slug)}`, SLUG: entry.slug,
    HREFLANG: hreflangBlock(entry.slug, langsAvail),
    OG_TITLE: attr(article.title), OG_DESCRIPTION: attr(article.standfirst), OG_IMAGE, OG_LOCALE: t.ogLocale,
    JSONLD: buildJsonLd(lang, article, entry, author),
    BRAND: "Blog", HUB_URL: hubUrl(lang), NAV_CATS: navCats(lang),
    T_SEARCH: esc(t.search), T_MENU: esc(t.menu), T_CLOSE: esc(t.close), T_SEARCH_PH: attr(t.searchPh), T_SEARCH_HINT: esc(t.searchHint),
    T_BREADCRUMB: esc(t.breadcrumb), T_SHARE: esc(t.share), T_READMIN: esc(t.readmin), T_TOC_HEAD: esc(t.tocHead), T_BACK: esc(t.back), T_MORE: esc(t.more),
    CATEGORY: esc(catName(lang, entry.category)), CATEGORY_CLASS: entry.category, BREADCRUMB_TITLE: esc(article.breadcrumb_title),
    STANDFIRST: esc(article.standfirst),
    AUTHOR_NAME: esc(author.name), AUTHOR_INITIAL: esc(author.initial),
    AUTHOR_ROLE: esc(lang === "es" ? (author.role_short || author.role) : (author.role_short_en || author.role_en)),
    AUTHOR_LABEL: esc(lang === "es" ? author.label : author.label_en),
    AUTHOR_BIO: esc(lang === "es" ? author.bio : author.bio_en),
    AUTHOR_BIO_SHORT: esc(lang === "es" ? author.bio_short : author.bio_short_en),
    DATE_ISO: entry.date, DATE_DISPLAY: fmtDate(lang, entry.date), READING_TIME: String(article.reading_time || entry.reading_time || 6),
    PROSE: renderProse(lang, article, service), TOC: renderToc(lang, article), RELATED: relCards,
    FOOTER_TAGLINE: esc(t.footerTagline), FOOTER_CATS: footerCats(lang),
    T_FOOTER_SECTIONS: esc(t.fSections), T_FOOTER_ABOUT: esc(t.fAbout), T_FOOTER_SERVICES: esc(t.fServices), T_FOOTER_WORK: esc(t.fWork),
    T_FOOTER_CONNECT: esc(t.fConnect), T_FOOTER_CONTACT: esc(t.fContact), T_FOOTER_PRIVACY: esc(t.fPrivacy), T_FOOTER_TERMS: esc(t.fTerms), T_FOOTER_BY: esc(t.fBy),
  };
  let html = template;
  for (const [k, v] of Object.entries(repl)) html = html.replaceAll(`{{${k}}}`, v);
  return html;
}

// ── listings (hubs + home + sitemap) ────────────────────────────────────────
function buildHub(lang, hubTemplate, published) {
  const t = STR[lang];
  const pub = published.filter((p) => (p.langs || ["es"]).includes(lang)).sort((a, b) => (a.date < b.date ? 1 : -1));
  const hero = pub.length ? heroHtml(lang, pub[0]) : "            <!-- no articles yet -->";
  const grid = pub.slice(1).map((p) => cardHtml(lang, p)).join("\n\n") || "                <!-- nothing more yet -->";
  const repl = {
    LANG: lang, BRAND: "Blog", HUB_URL: hubUrl(lang),
    HUB_TITLE: esc(t.hubTitle), HUB_META: attr(t.hubTagline), CANONICAL: `${SITE}${hubUrl(lang)}`,
    HREFLANG: hubHreflang(), OG_IMAGE, HUB_TAGLINE: esc(t.hubTagline),
    NAV_CATS: navCats(lang), HERO: hero, GRID: grid,
    LANG_SWITCH_URL: hubUrl(lang === "es" ? "en" : "es"), LANG_SWITCH_LABEL: esc(t.langSwitch),
    FOOTER_TAGLINE: esc(t.footerTagline), FOOTER_CATS: footerCats(lang),
    T_FOOTER_SECTIONS: esc(t.fSections), T_FOOTER_ABOUT: esc(t.fAbout), T_FOOTER_SERVICES: esc(t.fServices), T_FOOTER_WORK: esc(t.fWork),
    T_FOOTER_CONNECT: esc(t.fConnect), T_FOOTER_CONTACT: esc(t.fContact), T_FOOTER_BY: esc(t.fBy),
  };
  let html = hubTemplate;
  for (const [k, v] of Object.entries(repl)) html = html.replaceAll(`{{${k}}}`, v);
  return html;
}

function rebuildListings(config) {
  const pub = [...config.published].sort((a, b) => (a.date < b.date ? 1 : -1));
  const hubTemplate = read(HUB_TEMPLATE_PATH);

  for (const lang of LANGS) {
    const html = buildHub(lang, hubTemplate, pub);
    if (!DRY_RUN) write(lang === "es" ? path.join(ELPANTANO_DIR, "index.html") : path.join(EN_DIR, "index.html"), html);
  }

  // Home "Blog" strip (ES, latest 3)
  if (fs.existsSync(HOME_PATH) && pub.length) {
    let home = read(HOME_PATH);
    const cards = pub.slice(0, 3).map((p) => homeCardHtml(p)).join("\n");
    home = replaceRegion(home, "home", cards);
    if (!DRY_RUN) write(HOME_PATH, home);
  }

  // Sitemap: hubs + every article URL per available language, with lastmod.
  if (fs.existsSync(SITEMAP_PATH)) {
    let sm = read(SITEMAP_PATH);
    const today = todayISO();
    const wanted = [
      { loc: `${SITE}${hubUrl("es")}`, lastmod: today },
      { loc: `${SITE}${hubUrl("en")}`, lastmod: today },
    ];
    for (const p of pub) for (const l of (p.langs || ["es"])) wanted.push({ loc: `${SITE}${artUrl(l, p.slug)}`, lastmod: p.date });
    const missing = wanted.filter((w) => !sm.includes(`<loc>${w.loc}</loc>`));
    if (missing.length) {
      const entries = missing.map((w) => `  <url>\n    <loc>${w.loc}</loc>\n    <lastmod>${w.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${w.loc.endsWith("/") ? "0.8" : "0.6"}</priority>\n  </url>`).join("\n");
      sm = sm.replace("</urlset>", `${entries}\n</urlset>`);
      if (!DRY_RUN) write(SITEMAP_PATH, sm);
    }
  }
}

// module-level refs
let CATEGORIES, SERVICES, AUTHORS;

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const config = readJson(CONFIG_PATH);
  AUTHORS = readJson(AUTHORS_PATH);
  CATEGORIES = config.categories;
  SERVICES = config.services;
  const template = read(TEMPLATE_PATH);

  if (LISTINGS_ONLY) { rebuildListings(config); console.log("Listings rebuilt."); return; }

  let queue = config.topics.filter((t) => t.status === "pending");
  if (ONLY_SLUG) queue = config.topics.filter((t) => t.slug === ONLY_SLUG);
  queue = queue.slice(0, LIMIT);
  if (!queue.length) { console.log("No pending topics."); rebuildListings(config); return; }

  const client = new Anthropic({ apiKey: loadApiKey(), maxRetries: 5 });
  const model = MODEL_OVERRIDE || config.defaults?.model || "claude-opus-4-8";
  let produced = 0;

  for (const topic of queue) {
    const author = AUTHORS[topic.author];
    if (!author) { console.error(`  [skip] unknown author ${topic.author}`); continue; }
    console.log(`[gen] ${topic.slug} (${model})`);
    try {
      const es = await callJson(client, model, systemPromptES(), userPromptES(topic, config.published));
      let en = null;
      try { en = await callJson(client, model, "You are a precise translator. Output only valid JSON.", translatePrompt(es)); en = localizeEnLinks(en); }
      catch (e) { console.warn(`  [warn] EN translation failed: ${e.message}`); }

      const date = todayISO();
      const langs = en ? ["es", "en"] : ["es"];
      const entry = {
        slug: topic.slug, category: topic.category, author: topic.author, service: topic.service,
        date, reading_time: es.reading_time || 6, langs,
        title: { es: es.title, en: en ? en.title : es.title },
        standfirst: { es: es.standfirst, en: en ? en.standfirst : es.standfirst },
      };

      if (DRY_RUN) { console.log(`  [dry-run] ES "${es.title}" | EN "${en ? en.title : "(none)"}"`); continue; }

      // related = most recent published (excluding this), per lang availability handled in hub; for article use ES pool
      const relatedPool = config.published.filter((p) => p.slug !== entry.slug).slice(0, 3);
      write(artPath("es", topic.slug), renderArticlePage("es", template, es, entry, author, relatedPool, langs));
      if (en) write(artPath("en", topic.slug), renderArticlePage("en", template, en, entry, author, relatedPool.filter((p) => (p.langs || ["es"]).includes("en")), langs));

      topic.status = "done";
      config.published = config.published.filter((p) => p.slug !== entry.slug);
      config.published.unshift(entry);
      writeJson(CONFIG_PATH, config);
      rebuildListings(config);
      produced++;
      console.log(`  [ok] ${topic.slug} (${langs.join(", ")})`);
    } catch (err) {
      console.error(`  [error] ${topic.slug}: ${err.message}`);
    }
  }
  console.log(`Done. Generated ${produced} article(s).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
