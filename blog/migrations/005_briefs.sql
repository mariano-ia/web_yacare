-- Briefs table for client project brief submissions
-- Each client has its own HTML brief file in public/briefs/, all post to /api/brief
-- and land here with a unique brief_slug (e.g. 'brief-vixon').
CREATE TABLE IF NOT EXISTS briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_slug TEXT NOT NULL,
  client_name TEXT,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  respondent_role TEXT,
  project TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_briefs_created_at ON briefs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_slug ON briefs (brief_slug);
