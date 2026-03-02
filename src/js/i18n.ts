// ============================================
// YACARÉ — i18n (Internationalization) Module
// ============================================
// Detects the user's OS language, loads the corresponding JSON,
// and applies translations to all [data-i18n] elements in the DOM.
// Supports: 'en' (English), 'es' (Spanish)
// Extensible: add a new .json + include the code in SUPPORTED_LANGS.

const SUPPORTED_LANGS = ['en', 'es'] as const;
type Lang = typeof SUPPORTED_LANGS[number];

let currentLang: Lang = 'en';
let translations: Record<string, any> = {};

// ── Utility: safely access nested object keys via dot notation ──
// e.g. getNestedKey(obj, 'hero.title_1') → obj.hero.title_1
function getNestedKey(obj: Record<string, any>, key: string): string | null {
    const value = key.split('.').reduce<any>((acc, k) => {
        return acc && typeof acc === 'object' ? acc[k] : undefined;
    }, obj);
    return typeof value === 'string' ? value : null;
}

// ── Apply loaded translations to all [data-i18n] elements ──
function applyTranslations(): void {
    const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');

    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;

        const value = getNestedKey(translations, key);
        if (value === null) return;

        // Support data-i18n-attr for non-textContent attributes (e.g., placeholders)
        const attr = el.getAttribute('data-i18n-attr');
        if (attr) {
            el.setAttribute(attr, value);
        } else {
            // If the translation value contains HTML, use innerHTML
            if (value.includes('<') && value.includes('>')) {
                el.innerHTML = value;
            } else {
                // Preserve child elements (e.g., <br>, <strong>, icons)
                // Only replace text if the element has no element children, else update first text node
                const hasChildElements = Array.from(el.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE);
                if (!hasChildElements) {
                    el.textContent = value;
                } else {
                    // Find and replace the first text node
                    for (const node of Array.from(el.childNodes)) {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                            node.textContent = value;
                            break;
                        }
                    }
                }
            }
        }
    });

    // Also update HTML lang attribute for accessibility / SEO
    document.documentElement.lang = currentLang;

    // Sync footer lang toggle buttons
    updateLangToggle();
}

// ── Sync the footer EN/ES toggle pill to the active language ──
function updateLangToggle(): void {
    const btnEn = document.getElementById('lang-btn-en');
    const btnEs = document.getElementById('lang-btn-es');
    if (!btnEn || !btnEs) return;
    if (currentLang === 'es') {
        btnEs.classList.add('active');
        btnEn.classList.remove('active');
    } else {
        btnEn.classList.add('active');
        btnEs.classList.remove('active');
    }
}

// ── Load JSON for the given language ──
async function loadTranslations(lang: Lang): Promise<void> {
    try {
        const res = await fetch(`/locales/${lang}.json`);
        if (!res.ok) throw new Error(`Failed to load ${lang}.json`);
        translations = await res.json();
    } catch (err) {
        console.warn(`[i18n] Could not load '${lang}', falling back to 'en'.`, err);
        if (lang !== 'en') {
            await loadTranslations('en');
        }
    }
}

// ── Detect the best matching language from the browser/OS ──
function detectLang(): Lang {
    // 1. Check localStorage for manually saved preference
    const saved = localStorage.getItem('yacare_lang') as Lang | null;
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

    // 2. Use browser/OS language
    const browserLang = navigator.language.split('-')[0].toLowerCase() as Lang;
    if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

    // 3. Fallback to English
    return 'en';
}

// ── Public: change language manually and persist the choice ──
export async function setLanguage(lang: Lang): Promise<void> {
    if (!SUPPORTED_LANGS.includes(lang)) {
        console.warn(`[i18n] Unsupported language: '${lang}'. Falling back to 'en'.`);
        lang = 'en';
    }
    currentLang = lang;
    localStorage.setItem('yacare_lang', lang);
    await loadTranslations(lang);
    applyTranslations();

    // Dispatch a custom event for other modules to react if needed
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
}

// ── Public: get the current active language ──
export function getCurrentLang(): Lang {
    return currentLang;
}

// ── Public: init — detects language and applies translations ──
export async function initI18n(): Promise<void> {
    currentLang = detectLang();
    await loadTranslations(currentLang);
    applyTranslations();

    // Expose on window so inline footer toggle can call without module imports
    (window as any).i18n = { setLanguage, getCurrentLang };
}

