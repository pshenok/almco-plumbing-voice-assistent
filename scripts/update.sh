#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — Update Existing VAPI Agent
# Usage: ./scripts/update.sh [daytime|afterhours]
# Default: daytime
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

MODE="${1:-daytime}"
if [[ "$MODE" != "daytime" && "$MODE" != "afterhours" ]]; then
  echo -e "${RED}Usage:${NC} $0 [daytime|afterhours]"
  exit 1
fi

log()  { echo -e "${CYAN}[update]${NC} $1"; }
ok()   { echo -e "${GREEN}[   ok ]${NC} $1"; }
err()  { echo -e "${RED}[ error]${NC} $1" >&2; }

log "Mode: ${YELLOW}${MODE}${NC}"

# ── Load .env ──
ENV_FILE="$PROJECT_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  err ".env not found. Run setup.sh first."
  exit 1
fi
source "$ENV_FILE"

if [[ -z "${VAPI_API_KEY:-}" ]]; then
  err "VAPI_API_KEY is not set in .env"
  exit 1
fi
if [[ -z "${VAPI_ASSISTANT_ID:-}" ]]; then
  err "VAPI_ASSISTANT_ID is not set in .env. Run setup.sh first."
  exit 1
fi

API_URL="https://api.vapi.ai"

# ── Build config ──
log "Reading config and prompt..."

PROMPT_CONTENT=$(python3 -c "
import json
with open('$PROJECT_DIR/config/prompt-$MODE.md', 'r') as f:
    print(json.dumps(f.read()))
")

# Mode-specific first message
if [[ "$MODE" == "daytime" ]]; then
  FIRST_MSG="Hi there, thanks for calling Almco Plumbing! This is Sarah, the digital assistant — all our team members are on other calls right now, so I'm jumping in to grab your info. As soon as someone wraps up, they'll call you right back. What's going on?"
else
  FIRST_MSG="Hi there, thanks for calling Almco Plumbing! This is Sarah, the after-hours digital assistant. Our team is off for the night, but I'm here to take down your info so they can call you back first thing in the morning. What's going on?"
fi

CONFIG_JSON=$(python3 -c "
import json
with open('$PROJECT_DIR/config/assistant.json') as f:
    config = json.load(f)
with open('$PROJECT_DIR/config/prompt-$MODE.md') as f:
    config['model']['messages'][0]['content'] = f.read()
# Remove comment field, set firstMessage
config['model']['messages'][0].pop('_comment', None)
config['firstMessage'] = '''$FIRST_MSG'''
print(json.dumps(config))
")

# ── PATCH assistant ──
log "Updating assistant $VAPI_ASSISTANT_ID..."

RESPONSE=$(curl -s -X PATCH "$API_URL/assistant/$VAPI_ASSISTANT_ID" \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$CONFIG_JSON")

UPDATED_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
UPDATED_AT=$(echo "$RESPONSE" | jq -r '.updatedAt // empty')

if [[ -z "$UPDATED_ID" ]]; then
  err "Failed to update assistant:"
  echo "$RESPONSE" | jq .
  exit 1
fi

ok "Assistant updated successfully"
echo -e "  ID:         ${CYAN}$UPDATED_ID${NC}"
echo -e "  Updated at: ${CYAN}$UPDATED_AT${NC}"
echo -e "  Dashboard:  ${CYAN}https://dashboard.vapi.ai/assistants/$UPDATED_ID${NC}"
