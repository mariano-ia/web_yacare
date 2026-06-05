# El Pantano — SEO pipeline

Cron-driven generator that publishes Spanish, service-oriented SEO articles into
`elpantano/` (static HTML, Vite-bundled, no database). Mirrors the StoryHunt
pipeline pattern.

## How it works

1. `config.json` holds a curated queue of `topics` (status `pending`/`done`) plus
   the `published` list (source of truth for listings).
2. `generate.mjs` takes the next pending topic, asks Claude for a structured
   article (JSON), renders it through `template.html` into
   `elpantano/<slug>.html`, then refreshes:
   - the hub hero + "Lo último" grid in `elpantano/index.html`
   - the low-prominence "Del Pantano" strip at the bottom of `index.html`
   - `sitemap.xml`
3. `daily-publish.sh` orchestrates: git stash/pull, generate (1/day, catch-up
   capped at 3), commit, push. Vercel rebuilds on push (Vite auto-discovers
   `elpantano/*.html`).

## Run manually

```bash
# Needs ANTHROPIC_API_KEY in ../.env.local (gitignored)
node seo-pipeline/generate.mjs --limit 1        # one article
node seo-pipeline/generate.mjs --dry-run --limit 1   # call API, write nothing
node seo-pipeline/generate.mjs --listings-only  # rebuild hub/home/sitemap (no API)
bash seo-pipeline/daily-publish.sh              # full publish + commit + push
```

## The cron (local launchd)

- Wrapper: `~/Library/Scripts/yacare/seo-cron.sh`
- Agent:   `~/Library/LaunchAgents/com.yacare.elpantano.plist` (daily 10:30)

Enable / disable:

```bash
launchctl load   ~/Library/LaunchAgents/com.yacare.elpantano.plist   # enable
launchctl unload ~/Library/LaunchAgents/com.yacare.elpantano.plist   # disable
```

## Add topics

Append objects to `topics` in `config.json` (`status: "pending"`). Keep the list
curated and small: quality over volume avoids Google's scaled-content penalty.

## Model

`config.json` → `defaults.model` (default `claude-opus-4-8`). Drop to
`claude-sonnet-4-6` to cut cost.
