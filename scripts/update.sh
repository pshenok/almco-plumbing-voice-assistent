#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — Update Existing VAPI Agent
# Quick update: re-applies config + prompt
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[update]${NC} $1"; }
ok()   { echo -e "${GREEN}[   ok ]${NC} $1"; }
err()  { echo -e "${RED}[ error]${NC} $1" >&2; }

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
with open('$PROJECT_DIR/config/prompt.md', 'r') as f:
    print(json.dumps(f.read()))
")

CONFIG_JSON=$(cat "$PROJECT_DIR/config/assistant.json" | python3 -c "
import json, sys
config = json.load(sys.stdin)
prompt = json.loads($PROMPT_CONTENT)
config['model']['messages'][0]['content'] = prompt
json.dump(config, sys.stdout)
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
