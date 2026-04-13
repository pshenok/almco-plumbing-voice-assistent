# Almco Plumbing — AI Voice Agent

VAPI-powered inbound voice agent for Almco Plumbing Inc. (San Diego, CA). Answers customer calls in natural American English, handles service inquiries, and schedules appointments.

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — add your VAPI API key

# 2. First-time setup (creates assistant + buys phone number)
./scripts/setup.sh

# 3. Test it
./scripts/test-call.sh +14155551234
```

## Project Structure

```
config/
  assistant.json    — VAPI assistant config (voice, model, transcriber settings)
  prompt.md         — System prompt (edit this to change agent behavior)
knowledge/
  *.pdf             — Knowledge base documents
scripts/
  setup.sh          — Full setup: create assistant + buy phone number
  update.sh         — Update existing assistant (after editing config/prompt)
  test-call.sh      — Make a test outbound call
```

## Scripts

### `setup.sh [area_code] [--skip-phone]`
Full setup. Creates the VAPI assistant and purchases a phone number.

```bash
./scripts/setup.sh           # Default: 858 area code
./scripts/setup.sh 619       # Custom area code
./scripts/setup.sh 858 --skip-phone  # Skip phone purchase
```

On first run, saves `VAPI_ASSISTANT_ID` and `VAPI_PHONE_ID` to `.env`. On subsequent runs, updates the existing assistant.

### `update.sh`
Re-applies `config/assistant.json` + `config/prompt.md` to the existing assistant. Use after editing the prompt or voice settings.

```bash
# Edit the prompt
vim config/prompt.md

# Apply changes
./scripts/update.sh
```

### `test-call.sh <phone_number>`
Initiates an outbound test call from the agent to the given number.

```bash
./scripts/test-call.sh +14155551234
```

## Configuration

### Voice Settings (`config/assistant.json`)

| Setting | Value | Purpose |
|---------|-------|---------|
| Voice | ElevenLabs Rachel (Flash v2.5) | Natural American female voice |
| Transcriber | Deepgram Nova-3 | Best English speech-to-text |
| LLM | GPT-4o-mini | Fast, cost-effective for phone calls |
| Temperature | 0.5 | Balance of natural and reliable |
| Max Tokens | 150 | Short responses for fast delivery |
| Interruption Words | 2 | Prevents false interrupts from "uh-huh" |
| Streaming Latency | 4 (max) | Fastest voice delivery |

### System Prompt (`config/prompt.md`)
The agent's personality, knowledge, and call handling rules. Edit this file to change behavior, then run `./scripts/update.sh`.

## Workflow

```
Edit config/prompt.md or config/assistant.json
  → ./scripts/update.sh
  → Test by calling the phone number
  → git commit + push
```

## Requirements

- `curl` and `jq` installed
- `python3` available (for JSON escaping)
- VAPI account with API key

## Current Deployment

- **Phone:** +1 (858) 251-5093
- **Assistant ID:** 54462c2b-08e8-4db0-ab0a-fafb667d244a
- **Dashboard:** https://dashboard.vapi.ai
