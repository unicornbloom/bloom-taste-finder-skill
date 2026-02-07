#!/usr/bin/env bash

# Bloom Identity OpenClaw Wrapper
#
# This script is called by OpenClaw bot with conversation context
# It pipes the context to run-from-context.ts for analysis

set -e

# Get the directory of this script
WRAPPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOOM_SKILL_DIR="$(cd "$WRAPPER_DIR/.." && pwd)"

# Check if bloom-identity-skill is installed
if [ ! -d "$BLOOM_SKILL_DIR/src" ]; then
  echo "❌ Error: Bloom Identity Skill not found at $BLOOM_SKILL_DIR"
  echo ""
  echo "Please install:"
  echo "  cd ~/.openclaw/workspace"
  echo "  git clone https://github.com/unicornbloom/bloom-identity-skill.git"
  echo "  cd bloom-identity-skill"
  echo "  npm install"
  exit 1
fi

# Default user ID if not provided
USER_ID="${1:-$OPENCLAW_USER_ID}"

if [ -z "$USER_ID" ]; then
  echo "❌ Error: USER_ID required"
  echo ""
  echo "Usage: bash execute.sh <user-id>"
  echo "   or: Set OPENCLAW_USER_ID environment variable"
  exit 1
fi

echo "🌸 Bloom Identity - Analyzing conversation..."
echo ""

# Read conversation from stdin and pipe to analyzer
npx tsx "$BLOOM_SKILL_DIR/scripts/run-from-context.ts" --user-id "$USER_ID" --skip-share
