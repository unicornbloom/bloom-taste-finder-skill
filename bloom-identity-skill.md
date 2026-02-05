# Bloom Identity Card Generator

Generate your personalized Bloom Identity Card and discover matching OpenClaw skills based on your on-chain and social identity.

## Installation

```bash
curl -s https://bloomprotocol.ai/bloom-identity-skill.md | openclaw install
```

## Usage

```
Generate my bloom identity
```

## What it does

1. 🔍 Analyzes your Twitter/X activity and on-chain identity
2. 🎨 Generates your unique personality type (Visionary, Explorer, Cultivator, Optimizer, or Innovator)
3. 🎯 Recommends matching OpenClaw skills based on your interests
4. 🤖 Creates an agent wallet for you to tip skill creators
5. 🌐 Provides a dashboard link to view your full identity card

## Features

- **Automatic Analysis**: Scans your social and on-chain data
- **Manual Fallback**: If data is insufficient, asks you questions
- **Skill Discovery**: Finds OpenClaw skills that match your profile
- **Agent Wallet**: Get your own on-chain agent identity
- **Dashboard Access**: View and share your full identity card

## Example Response

```
🎉 Your Bloom Identity Card is ready! 🤖

💜 The Visionary (85% confidence)
💬 "See beyond the hype"

📝 You are a forward-thinking builder who sees beyond 
    the hype and focuses on real-world impact.

🏷️ Categories: Crypto, DeFi, Web3

🎯 Recommended OpenClaw Skills (3):
1. DeFi Protocol Analyzer (95% match)
2. Smart Contract Auditor (90% match)
3. Gas Optimizer (88% match)

🤖 Agent On-Chain Identity
📍 Wallet: 0x03Ce...9905
🔗 X402: https://x402.bloomprotocol.ai/base-sepolia/0x...
⛓️  Network: base-sepolia

🌐 View full dashboard:
   https://preview.bloomprotocol.ai/dashboard?token=...
```

## Triggers

- "generate my bloom identity"
- "create my identity card"
- "analyze my supporter profile"
- "mint my bloom card"
- "discover my personality"

## Technical Details

- **Version**: 2.0.0
- **Network**: Base Sepolia (testnet)
- **Authentication**: EIP-191 signed tokens with 7-layer security
- **Integration**: Coinbase AgentKit + ClawHub API

---

Built by [Bloom Protocol](https://bloomprotocol.ai)
