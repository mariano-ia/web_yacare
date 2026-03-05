-- ═══════════════════════════════════════════════════════
-- EL PANTANO — Migration: Add view_count to articles
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Add view_count column (safe: won't error if already exists)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;

-- Create index for fast ordering by view_count
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count DESC);

-- Function to atomically increment view count
CREATE OR REPLACE FUNCTION increment_view_count(article_slug text)
RETURNS void AS $$
BEGIN
  UPDATE articles SET view_count = view_count + 1 WHERE slug = article_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION increment_view_count(text) TO anon;
GRANT EXECUTE ON FUNCTION increment_view_count(text) TO authenticated;
