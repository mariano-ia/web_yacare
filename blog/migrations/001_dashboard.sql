-- ============================================================
-- El Pantano Dashboard — Migration 001
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- AI usage logs (filled by N8N workflows)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow     TEXT NOT NULL,            -- 'cron' | 'telegram'
  model        TEXT NOT NULL,            -- 'gpt-4o' | 'gemini-2.5-flash-image'
  type         TEXT NOT NULL,            -- 'post' | 'image'
  tokens_in    INTEGER DEFAULT 0,
  tokens_out   INTEGER DEFAULT 0,
  cost_usd     NUMERIC(10,6) DEFAULT 0,
  article_slug TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers (upsert-safe — won't fail if already exists)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  subscribed_at  TIMESTAMPTZ DEFAULT NOW(),
  active         BOOLEAN DEFAULT TRUE
);

-- Index for fast date-range queries on usage logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_type ON ai_usage_logs (type);
