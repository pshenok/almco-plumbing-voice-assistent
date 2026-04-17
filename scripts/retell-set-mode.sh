#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — Switch Retell Agent Mode
# Usage: ./scripts/retell-set-mode.sh [daytime|afterhours]
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

MODE="${1:-}"

if [[ "$MODE" != "daytime" && "$MODE" != "afterhours" ]]; then
  echo -e "${RED}Usage:${NC} $0 [daytime|afterhours]"
  echo ""
  echo "  daytime    - Agent picks up when dispatchers are busy on other lines"
  echo "               Callback: 'someone will call you back in a few minutes'"
  echo ""
  echo "  afterhours - Agent picks up after 6pm / outside business hours"
  echo "               Callback: 'our team starts at 7am tomorrow'"
  exit 1
fi

source "$PROJECT_DIR/.env"

PROMPT_FILE="$PROJECT_DIR/config/prompt-${MODE}.md"
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo -e "${RED}[error]${NC} Prompt file not found: $PROMPT_FILE"
  exit 1
fi

echo -e "${CYAN}[retell]${NC} Switching to ${YELLOW}${MODE}${NC} mode..."

if [[ "$MODE" == "daytime" ]]; then
  BEGIN_MSG="Hi there, thanks for calling Almco Plumbing! This is Sarah, the digital assistant — all our team members are on other calls right now, so I'm jumping in to grab your info. As soon as someone wraps up, they'll call you right back. What's going on?"
else
  BEGIN_MSG="Hi there, thanks for calling Almco Plumbing! This is Sarah, the after-hours digital assistant. Our team is off for the night, but I'm here to take down your info so they can call you back first thing in the morning. What's going on?"
fi

python3 -c "
import json
with open('$PROMPT_FILE') as f:
    prompt = f.read()
with open('/tmp/retell_llm_mode.json', 'w') as f:
    json.dump({
        'model': 'gpt-4o',
        'model_temperature': 0.4,
        'model_high_priority': True,
        'general_prompt': prompt,
        'begin_message': '''$BEGIN_MSG''',
        'start_speaker': 'agent',
        'knowledge_base_ids': ['knowledge_base_bac228ce038c6079']
    }, f)
"

RESPONSE=$(curl -s -X PATCH "https://api.retellai.com/update-retell-llm/$RETELL_LLM_ID" \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/retell_llm_mode.json)

UPDATED=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('llm_id', ''))")

if [[ -n "$UPDATED" ]]; then
  echo -e "${GREEN}[  ok ]${NC} Agent switched to ${YELLOW}${MODE}${NC} mode"
  echo -e "  LLM:        ${CYAN}$UPDATED${NC}"
  echo -e "  Phone:      ${CYAN}$RETELL_PHONE_ID${NC}"
  echo -e "  Begin msg:  ${CYAN}${BEGIN_MSG:0:80}...${NC}"
else
  echo -e "${RED}[error]${NC} Update failed: $RESPONSE"
  exit 1
fi
