#!/bin/bash
# El Pantano — SEO daily publisher.
# Mirrors the StoryHunt pipeline: catch-up batching, git stash/pull/push,
# macOS notifications, never silently fails.
#
# Generates up to BATCH_SIZE articles per run (more if days were missed),
# drains the queue in seo-pipeline/config.json, commits and pushes so Vercel
# rebuilds. Run by launchd (com.yacare.elpantano) or manually.

PIPELINE_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$PIPELINE_DIR")"
LOG_FILE="$PIPELINE_DIR/publish.log"
STATE_FILE="$PIPELINE_DIR/.last_run"
BATCH_SIZE=1            # 1 quality article/day; low volume on purpose (anti-spam)
BATCH_CAP=3            # never publish more than this in one catch-up run

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
NODE="$(command -v node)"

cd "$ROOT_DIR" || exit 1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

notify() {
    local title="$1"; local message="$2"; local sound="${3:-default}"
    osascript -e "display notification \"$message\" with title \"El Pantano SEO\" subtitle \"$title\" sound name \"$sound\"" 2>/dev/null || true
}

on_error() {
    local code=$?; local line=$1
    log "ERROR: failed at line $line (exit $code)"
    notify "FALLÓ" "Revisá publish.log (línea $line)" "Basso"
    exit $code
}
trap 'on_error $LINENO' ERR

log "=== Starting El Pantano daily publish ==="

if [ -z "$NODE" ]; then
    log "ERROR: node not found on PATH"
    notify "FALLÓ" "node no está en el PATH" "Basso"
    exit 1
fi

# Catch-up: if days were missed, scale the batch (capped).
if [ -f "$STATE_FILE" ]; then
    last_run=$(cat "$STATE_FILE")
    today=$(date '+%Y-%m-%d')
    if [ "$last_run" != "$today" ]; then
        if days_missed=$(( ($(date -j -f '%Y-%m-%d' "$today" '+%s') - $(date -j -f '%Y-%m-%d' "$last_run" '+%s')) / 86400 )) 2>/dev/null; then
            if [ "$days_missed" -gt 1 ]; then
                BATCH_SIZE=$days_missed
                [ "$BATCH_SIZE" -gt "$BATCH_CAP" ] && BATCH_SIZE=$BATCH_CAP
                log "Missed $days_missed day(s). Batch size: $BATCH_SIZE"
            fi
        fi
    fi
fi

# Count pending topics.
pending=$("$NODE" -e "const c=require('$PIPELINE_DIR/config.json');console.log(c.topics.filter(t=>t.status==='pending').length)")
log "Pending topics: $pending"

if [ "$pending" -eq 0 ]; then
    log "No pending topics. Refreshing listings only."
    "$NODE" "$PIPELINE_DIR/generate.mjs" --listings-only 2>&1 | tee -a "$LOG_FILE" || true
    date '+%Y-%m-%d' > "$STATE_FILE"
    notify "OK" "Sin temas pendientes. Cola vacía."
    exit 0
fi
[ "$pending" -lt "$BATCH_SIZE" ] && BATCH_SIZE=$pending

# Pull latest first, stashing any local changes.
log "Pulling latest from origin..."
stash_needed=0
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git stash push -u -m "cron-auto-stash-$(date +%s)" 2>&1 | tee -a "$LOG_FILE" && stash_needed=1
fi
git pull --rebase origin main 2>&1 | tee -a "$LOG_FILE" || log "WARNING: git pull failed. Continuing."
if [ "$stash_needed" = "1" ]; then
    git stash pop 2>&1 | tee -a "$LOG_FILE" || log "WARNING: stash pop had conflicts"
fi

# Generate.
log "Generating $BATCH_SIZE article(s)..."
"$NODE" "$PIPELINE_DIR/generate.mjs" --limit "$BATCH_SIZE" 2>&1 | tee -a "$LOG_FILE"

# Anything to commit?
modified=$(git status -s elpantano/ index.html sitemap.xml seo-pipeline/config.json 2>/dev/null | wc -l | tr -d ' ')
if [ "$modified" -eq 0 ]; then
    log "No changes to commit."
    date '+%Y-%m-%d' > "$STATE_FILE"
    notify "OK" "No se generó nada nuevo."
    exit 0
fi

new_files=$(git status -s elpantano/ | grep -c '^??' || echo 0)
log "Committing ($new_files new article file(s))..."
git add elpantano/*.html index.html sitemap.xml seo-pipeline/config.json
git commit -m "seo(elpantano): publica $new_files nota(s) ($(date '+%Y-%m-%d'))" 2>&1 | tee -a "$LOG_FILE"

log "Pushing to origin..."
if ! git push origin main 2>&1 | tee -a "$LOG_FILE"; then
    log "ERROR: git push failed"
    notify "PUSH FALLÓ" "$new_files nota(s) commiteadas localmente, sin pushear" "Basso"
    exit 1
fi

date '+%Y-%m-%d' > "$STATE_FILE"
pending_left=$("$NODE" -e "const c=require('$PIPELINE_DIR/config.json');console.log(c.topics.filter(t=>t.status==='pending').length)")
log "Done. Published $new_files. Pending left: $pending_left."
log "=== Finished ==="
notify "OK" "Publicadas $new_files nota(s). Quedan $pending_left en la cola."
