-- Bilingual support: add language column and translation linking
-- All existing articles become 'es' by default

-- Language column
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'es'
  CHECK (lang IN ('es', 'en'));

-- Translation link (points to the original Spanish article)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS translation_of UUID REFERENCES articles(id) ON DELETE SET NULL;

-- Slug must be unique per language (not globally)
ALTER TABLE articles
  DROP CONSTRAINT IF EXISTS articles_slug_key;

ALTER TABLE articles
  ADD CONSTRAINT articles_slug_lang_unique UNIQUE (slug, lang);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_articles_lang ON articles(lang);
CREATE INDEX IF NOT EXISTS idx_articles_translation_of ON articles(translation_of);
