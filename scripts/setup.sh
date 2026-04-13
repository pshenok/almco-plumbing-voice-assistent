#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — VAPI Voice Agent Setup
# Creates assistant + buys phone number
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[setup]${NC} $1"; }
ok()   { echo -e "${GREEN}[  ok ]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn ]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1" >&2; }

# ── Check dependencies ──
for cmd in curl jq; do
  if ! command -v "$cmd" &>/dev/null; then
    err "$cmd is required but not installed."
    exit 1
  fi
done

# ── Load .env ──
ENV_FILE="$PROJECT_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  err ".env file not found. Copy .env.example to .env and fill in your API key."
  exit 1
fi
source "$ENV_FILE"

if [[ -z "${VAPI_API_KEY:-}" ]]; then
  err "VAPI_API_KEY is not set in .env"
  exit 1
fi

API_URL="https://api.vapi.ai"
AUTH_HEADER="Authorization: Bearer $VAPI_API_KEY"

# ── Parse args ──
AREA_CODE="${1:-858}"
SKIP_PHONE="${2:-}"

log "Starting Almco Plumbing Voice Agent setup..."
log "Phone area code: $AREA_CODE"

# ── Build config with prompt injected ──
log "Reading config and prompt..."

PROMPT_FILE="$PROJECT_DIR/config/prompt.md"
CONFIG_FILE="$PROJECT_DIR/config/assistant.json"

if [[ ! -f "$PROMPT_FILE" ]]; then
  err "config/prompt.md not found"
  exit 1
fi
if [[ ! -f "$CONFIG_FILE" ]]; then
  err "config/assistant.json not found"
  exit 1
fi

# Read prompt and escape for JSON
PROMPT_CONTENT=$(python3 -c "
import json, sys
with open('$PROMPT_FILE', 'r') as f:
    print(json.dumps(f.read()))
")

# Inject prompt into config (replace placeholder)
CONFIG_JSON=$(cat "$CONFIG_FILE" | python3 -c "
import json, sys
config = json.load(sys.stdin)
prompt = json.loads($PROMPT_CONTENT)
config['model']['messages'][0]['content'] = prompt
json.dump(config, sys.stdout)
")

# ── Create or update assistant ──
if [[ -n "${VAPI_ASSISTANT_ID:-}" ]]; then
  log "Updating existing assistant: $VAPI_ASSISTANT_ID"

  RESPONSE=$(curl -s -X PATCH "$API_URL/assistant/$VAPI_ASSISTANT_ID" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "$CONFIG_JSON")

  ASSISTANT_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
  if [[ -z "$ASSISTANT_ID" ]]; then
    err "Failed to update assistant:"
    echo "$RESPONSE" | jq .
    exit 1
  fi
  ok "Assistant updated: $ASSISTANT_ID"
else
  log "Creating new assistant..."

  RESPONSE=$(curl -s -X POST "$API_URL/assistant" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "$CONFIG_JSON")

  ASSISTANT_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
  if [[ -z "$ASSISTANT_ID" ]]; then
    err "Failed to create assistant:"
    echo "$RESPONSE" | jq .
    exit 1
  fi
  ok "Assistant created: $ASSISTANT_ID"

  # Save assistant ID back to .env
  if grep -q "^VAPI_ASSISTANT_ID=" "$ENV_FILE"; then
    sed -i '' "s/^VAPI_ASSISTANT_ID=.*/VAPI_ASSISTANT_ID=$ASSISTANT_ID/" "$ENV_FILE"
  else
    echo "VAPI_ASSISTANT_ID=$ASSISTANT_ID" >> "$ENV_FILE"
  fi
  ok "Assistant ID saved to .env"
fi

# ── Buy phone number ──
if [[ "$SKIP_PHONE" == "--skip-phone" ]]; then
  warn "Skipping phone number purchase (--skip-phone)"
elif [[ -n "${VAPI_PHONE_ID:-}" ]]; then
  log "Phone number already exists: $VAPI_PHONE_ID"
  log "Updating phone number to point to assistant..."

  RESPONSE=$(curl -s -X PATCH "$API_URL/phone-number/$VAPI_PHONE_ID" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{\"assistantId\": \"$ASSISTANT_ID\"}")

  PHONE_NUMBER=$(echo "$RESPONSE" | jq -r '.number // empty')
  ok "Phone number updated: $PHONE_NUMBER -> assistant $ASSISTANT_ID"
else
  log "Buying new phone number (area code: $AREA_CODE)..."

  RESPONSE=$(curl -s -X POST "$API_URL/phone-number" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{
      \"provider\": \"vapi\",
      \"assistantId\": \"$ASSISTANT_ID\",
      \"numberDesiredAreaCode\": \"$AREA_CODE\",
      \"name\": \"Almco Plumbing Line\"
    }")

  PHONE_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
  PHONE_NUMBER=$(echo "$RESPONSE" | jq -r '.number // empty')

  if [[ -z "$PHONE_ID" ]]; then
    err "Failed to buy phone number:"
    echo "$RESPONSE" | jq .
    exit 1
  fi

  ok "Phone number purchased: $PHONE_NUMBER"

  # Save phone ID back to .env
  if grep -q "^VAPI_PHONE_ID=" "$ENV_FILE"; then
    sed -i '' "s/^VAPI_PHONE_ID=.*/VAPI_PHONE_ID=$PHONE_ID/" "$ENV_FILE"
  else
    echo "VAPI_PHONE_ID=$PHONE_ID" >> "$ENV_FILE"
  fi
  ok "Phone ID saved to .env"
fi

# ── Summary ──
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Almco Plumbing Voice Agent — Setup Complete${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Assistant ID:  ${CYAN}$ASSISTANT_ID${NC}"
echo -e "  Dashboard:     ${CYAN}https://dashboard.vapi.ai/assistants/$ASSISTANT_ID${NC}"
if [[ -n "${PHONE_NUMBER:-}" ]]; then
  echo -e "  Phone Number:  ${CYAN}$PHONE_NUMBER${NC}"
fi
echo ""
echo -e "  ${YELLOW}Test it:${NC} Call the phone number above"
echo -e "  ${YELLOW}Or run:${NC}  ./scripts/test-call.sh +1XXXXXXXXXX"
echo ""
