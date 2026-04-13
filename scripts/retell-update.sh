#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — Update Retell Agent
# Re-applies config + prompt to existing agent
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[retell]${NC} $1"; }
ok()   { echo -e "${GREEN}[   ok ]${NC} $1"; }
err()  { echo -e "${RED}[ error]${NC} $1" >&2; }

source "$PROJECT_DIR/.env"
[[ -n "${RETELL_API_KEY:-}" ]] || { err "RETELL_API_KEY not set"; exit 1; }
[[ -n "${RETELL_LLM_ID:-}" ]] || { err "RETELL_LLM_ID not set. Run retell-setup.sh first"; exit 1; }
[[ -n "${RETELL_AGENT_ID:-}" ]] || { err "RETELL_AGENT_ID not set. Run retell-setup.sh first"; exit 1; }

API="https://api.retellai.com"
AUTH="Authorization: Bearer $RETELL_API_KEY"

# ── Update LLM (prompt + model settings) ──
log "Updating LLM $RETELL_LLM_ID..."

python3 -c "
import json
with open('$PROJECT_DIR/config/prompt.md') as f:
    prompt = f.read()
with open('$PROJECT_DIR/config/retell-agent.json') as f:
    config = json.load(f)
llm = config.get('_llm_config', {})
payload = {
    'model': llm.get('model', 'gpt-4o'),
    'model_temperature': llm.get('model_temperature', 0.6),
    'general_prompt': prompt,
    'begin_message': llm.get('begin_message', ''),
    'start_speaker': llm.get('start_speaker', 'agent')
}
with open('/tmp/retell_llm.json', 'w') as f:
    json.dump(payload, f)
"

RESPONSE=$(curl -s -X PATCH "$API/update-retell-llm/$RETELL_LLM_ID" \
  -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/retell_llm.json)
ok "LLM updated"

# ── Update Agent (voice + settings) ──
log "Updating agent $RETELL_AGENT_ID..."

python3 -c "
import json
with open('$PROJECT_DIR/config/retell-agent.json') as f:
    config = json.load(f)
config.pop('_llm_config', None)
config.pop('response_engine', None)
with open('/tmp/retell_agent.json', 'w') as f:
    json.dump(config, f)
"

RESPONSE=$(curl -s -X PATCH "$API/update-agent/$RETELL_AGENT_ID" \
  -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/retell_agent.json)
UPDATED=$(echo "$RESPONSE" | jq -r '.last_modification_timestamp // empty')

ok "Agent updated"
echo -e "  Agent:     ${CYAN}$RETELL_AGENT_ID${NC}"
echo -e "  Timestamp: ${CYAN}$UPDATED${NC}"
echo -e "  Dashboard: ${CYAN}https://dashboard.retellai.com${NC}"
