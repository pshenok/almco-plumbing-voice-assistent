#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — Retell Test Outbound Call
# Usage: ./scripts/retell-test-call.sh +14155551234
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

[[ $# -ge 1 ]] || { echo "Usage: $0 <phone_number>"; echo "Example: $0 +14155551234"; exit 1; }
PHONE_TO="$1"

source "$PROJECT_DIR/.env"
[[ -n "${RETELL_API_KEY:-}" && -n "${RETELL_AGENT_ID:-}" && -n "${RETELL_PHONE_ID:-}" ]] || {
  echo -e "${RED}[error]${NC} Missing RETELL_API_KEY, RETELL_AGENT_ID, or RETELL_PHONE_ID in .env"
  exit 1
}

echo -e "${CYAN}[retell]${NC} Calling $PHONE_TO..."

RESPONSE=$(curl -s -X POST "https://api.retellai.com/v2/create-phone-call" \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_number\": \"$RETELL_PHONE_ID\",
    \"to_number\": \"$PHONE_TO\",
    \"agent_id\": \"$RETELL_AGENT_ID\"
  }")

CALL_ID=$(echo "$RESPONSE" | jq -r '.call_id // empty')
CALL_STATUS=$(echo "$RESPONSE" | jq -r '.call_status // empty')

if [[ -z "$CALL_ID" ]]; then
  echo -e "${RED}[error]${NC} Failed:"
  echo "$RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}[  ok ]${NC} Call initiated!"
echo -e "  Call ID: ${CYAN}$CALL_ID${NC}"
echo -e "  Status:  ${CYAN}$CALL_STATUS${NC}"
echo -e "  To:      ${CYAN}$PHONE_TO${NC}"
echo -e "  Dashboard: ${CYAN}https://dashboard.retellai.com${NC}"
