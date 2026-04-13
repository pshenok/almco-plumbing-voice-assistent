#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Almco Plumbing — Test Outbound Call
# Usage: ./scripts/test-call.sh +14155551234
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Check args ──
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <phone_number>"
  echo "Example: $0 +14155551234"
  exit 1
fi

PHONE_TO="$1"

# ── Load .env ──
source "$PROJECT_DIR/.env"

if [[ -z "${VAPI_API_KEY:-}" || -z "${VAPI_ASSISTANT_ID:-}" || -z "${VAPI_PHONE_ID:-}" ]]; then
  echo -e "${RED}[error]${NC} Missing VAPI_API_KEY, VAPI_ASSISTANT_ID, or VAPI_PHONE_ID in .env"
  exit 1
fi

echo -e "${CYAN}[test]${NC} Calling $PHONE_TO with assistant $VAPI_ASSISTANT_ID..."

RESPONSE=$(curl -s -X POST "https://api.vapi.ai/call" \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"assistantId\": \"$VAPI_ASSISTANT_ID\",
    \"phoneNumberId\": \"$VAPI_PHONE_ID\",
    \"customer\": {
      \"number\": \"$PHONE_TO\"
    }
  }")

CALL_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
CALL_STATUS=$(echo "$RESPONSE" | jq -r '.status // empty')

if [[ -z "$CALL_ID" ]]; then
  echo -e "${RED}[error]${NC} Failed to create call:"
  echo "$RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}[  ok ]${NC} Call initiated!"
echo -e "  Call ID: ${CYAN}$CALL_ID${NC}"
echo -e "  Status:  ${CYAN}$CALL_STATUS${NC}"
echo -e "  To:      ${CYAN}$PHONE_TO${NC}"
echo ""
echo -e "  View logs: ${CYAN}https://dashboard.vapi.ai/calls${NC}"
