#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — Retell AI Voice Agent Setup
# Creates LLM + agent + buys phone number
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[retell]${NC} $1"; }
ok()   { echo -e "${GREEN}[   ok ]${NC} $1"; }
warn() { echo -e "${YELLOW}[ warn ]${NC} $1"; }
err()  { echo -e "${RED}[ error]${NC} $1" >&2; }

for cmd in curl jq python3; do
  command -v "$cmd" &>/dev/null || { err "$cmd required"; exit 1; }
done

ENV_FILE="$PROJECT_DIR/.env"
[[ -f "$ENV_FILE" ]] || { err ".env not found. Copy .env.example to .env"; exit 1; }
source "$ENV_FILE"
[[ -n "${RETELL_API_KEY:-}" ]] || { err "RETELL_API_KEY not set in .env"; exit 1; }

API="https://api.retellai.com"
AUTH="Authorization: Bearer $RETELL_API_KEY"
AREA_CODE="${1:-858}"
SKIP_PHONE="${2:-}"

log "Starting Retell AI setup (area code: $AREA_CODE)..."

# ── Build prompt ──
PROMPT_FILE="$PROJECT_DIR/config/prompt.md"
CONFIG_FILE="$PROJECT_DIR/config/retell-agent.json"
[[ -f "$PROMPT_FILE" ]] || { err "config/prompt.md not found"; exit 1; }
[[ -f "$CONFIG_FILE" ]] || { err "config/retell-agent.json not found"; exit 1; }

# ── Create or update LLM ──
python3 -c "
import json
with open('$PROMPT_FILE') as f:
    prompt = f.read()
with open('$CONFIG_FILE') as f:
    config = json.load(f)
llm = config.get('_llm_config', {})
llm_payload = {
    'model': llm.get('model', 'gpt-4o'),
    'model_temperature': llm.get('model_temperature', 0.6),
    'general_prompt': prompt,
    'begin_message': llm.get('begin_message', ''),
    'start_speaker': llm.get('start_speaker', 'agent')
}
with open('/tmp/retell_llm.json', 'w') as f:
    json.dump(llm_payload, f)
"

if [[ -n "${RETELL_LLM_ID:-}" ]]; then
  log "Updating existing LLM: $RETELL_LLM_ID"
  RESPONSE=$(curl -s -X PATCH "$API/update-retell-llm/$RETELL_LLM_ID" \
    -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/retell_llm.json)
  LLM_ID="$RETELL_LLM_ID"
  ok "LLM updated: $LLM_ID"
else
  log "Creating new LLM..."
  RESPONSE=$(curl -s -X POST "$API/create-retell-llm" \
    -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/retell_llm.json)
  LLM_ID=$(echo "$RESPONSE" | jq -r '.llm_id // empty')
  [[ -n "$LLM_ID" ]] || { err "Failed to create LLM: $RESPONSE"; exit 1; }
  ok "LLM created: $LLM_ID"

  if grep -q "^RETELL_LLM_ID=" "$ENV_FILE"; then
    sed -i '' "s/^RETELL_LLM_ID=.*/RETELL_LLM_ID=$LLM_ID/" "$ENV_FILE"
  else
    echo "RETELL_LLM_ID=$LLM_ID" >> "$ENV_FILE"
  fi
fi

# ── Create or update Agent ──
python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
# Remove internal-only keys
config.pop('_llm_config', None)
config['response_engine'] = {
    'type': 'retell-llm',
    'llm_id': '$LLM_ID'
}
with open('/tmp/retell_agent.json', 'w') as f:
    json.dump(config, f)
"

if [[ -n "${RETELL_AGENT_ID:-}" ]]; then
  log "Updating existing agent: $RETELL_AGENT_ID"
  RESPONSE=$(curl -s -X PATCH "$API/update-agent/$RETELL_AGENT_ID" \
    -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/retell_agent.json)
  AGENT_ID="$RETELL_AGENT_ID"
  ok "Agent updated: $AGENT_ID"
else
  log "Creating new agent..."
  RESPONSE=$(curl -s -X POST "$API/create-agent" \
    -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/retell_agent.json)
  AGENT_ID=$(echo "$RESPONSE" | jq -r '.agent_id // empty')
  [[ -n "$AGENT_ID" ]] || { err "Failed to create agent: $RESPONSE"; exit 1; }
  ok "Agent created: $AGENT_ID"

  if grep -q "^RETELL_AGENT_ID=" "$ENV_FILE"; then
    sed -i '' "s/^RETELL_AGENT_ID=.*/RETELL_AGENT_ID=$AGENT_ID/" "$ENV_FILE"
  else
    echo "RETELL_AGENT_ID=$AGENT_ID" >> "$ENV_FILE"
  fi
fi

# ── Phone number ──
if [[ "$SKIP_PHONE" == "--skip-phone" ]]; then
  warn "Skipping phone purchase"
elif [[ -n "${RETELL_PHONE_ID:-}" ]]; then
  log "Updating existing phone: $RETELL_PHONE_ID"
  curl -s -X PATCH "$API/update-phone-number/$RETELL_PHONE_ID" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"agent_id\": \"$AGENT_ID\"}" > /dev/null
  ok "Phone updated -> agent $AGENT_ID"
  PHONE_NUMBER="$RETELL_PHONE_ID"
else
  log "Buying phone number (area code: $AREA_CODE)..."
  RESPONSE=$(curl -s -X POST "$API/create-phone-number" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"$AGENT_ID\",
      \"area_code\": $AREA_CODE,
      \"nickname\": \"Almco Plumbing Line\"
    }")
  PHONE_NUMBER=$(echo "$RESPONSE" | jq -r '.phone_number // empty')
  [[ -n "$PHONE_NUMBER" ]] || { err "Failed to buy number: $RESPONSE"; exit 1; }
  ok "Phone purchased: $PHONE_NUMBER"

  if grep -q "^RETELL_PHONE_ID=" "$ENV_FILE"; then
    sed -i '' "s/^RETELL_PHONE_ID=.*/RETELL_PHONE_ID=$PHONE_NUMBER/" "$ENV_FILE"
  else
    echo "RETELL_PHONE_ID=$PHONE_NUMBER" >> "$ENV_FILE"
  fi
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Almco Plumbing (Retell AI) — Setup Complete${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Agent ID:    ${CYAN}$AGENT_ID${NC}"
echo -e "  LLM ID:      ${CYAN}$LLM_ID${NC}"
echo -e "  Dashboard:   ${CYAN}https://dashboard.retellai.com${NC}"
if [[ -n "${PHONE_NUMBER:-}" ]]; then
  echo -e "  Phone:       ${CYAN}$PHONE_NUMBER${NC}"
fi
echo ""
echo -e "  ${YELLOW}Test:${NC} Call the phone number above"
echo -e "  ${YELLOW}Or:${NC}   ./scripts/retell-test-call.sh +1XXXXXXXXXX"
echo ""
