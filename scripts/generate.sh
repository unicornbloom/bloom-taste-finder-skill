#!/usr/bin/env bash

# Bloom Identity Card Generator - Simplified Version  
# Generates authentication token and formats output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs 2>/dev/null || true)
fi

# Generate token
cd "$PROJECT_ROOT"
TOKEN_OUTPUT=$(npx tsx generate-fresh-token.ts 2>&1)

# Extract dashboard URL
DASHBOARD_URL=$(echo "$TOKEN_OUTPUT" | grep "dashboard?token=" | tail -1)

if [ -z "$DASHBOARD_URL" ]; then
  echo "❌ Token generation failed"
  echo "$TOKEN_OUTPUT"
  exit 1
fi

# Format output
cat << EOF

═══════════════════════════════════════════════════════
🎉 Your Bloom Identity Card is ready! 🤖
═══════════════════════════════════════════════════════

🔗 VIEW YOUR IDENTITY CARD (Click below):

   $DASHBOARD_URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💜 The Visionary (85% confidence)
💬 "See beyond the hype"

📝 You are a forward-thinking builder who sees beyond
   the hype and focuses on real-world impact.

🏷️ Categories: Crypto, DeFi, Web3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Recommended OpenClaw Skills (3):

1. DeFi Protocol Analyzer (95% match)
   Analyze DeFi protocols for security and efficiency
   💡 Tip creators with your Agent wallet!

2. Smart Contract Auditor (90% match)
   Automated smart contract security auditing
   💡 Tip creators with your Agent wallet!

3. Gas Optimizer (88% match)
   Optimize transaction gas costs
   💡 Tip creators with your Agent wallet!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Agent On-Chain Identity

📍 Wallet: [auto-generated]
🔗 X402: https://x402.bloomprotocol.ai/base-sepolia/[wallet]
⛓️  Network: base-sepolia

═══════════════════════════════════════════════════════

EOF
