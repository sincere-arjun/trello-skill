# trello-skill 🗂️

[![SecureSkills Verified](https://img.shields.io/badge/SecureSkills-Verified-00d4aa)](https://secureskills.io)
[![Trust Score](https://img.shields.io/badge/Trust%20Score-8.5%2F10-4a9eff)](./AUDIT_REPORT.md)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

> Manage Trello boards, lists, and cards from OpenClaw/Clawd. Built by [SecureSkills](https://secureskills.io) — the verified skill marketplace for AI agents.

---

## 🛡️ Security First

This skill has been audited with the **SecureSkills 50+ Point Security Rubric**:
- ✅ No filesystem access outside `~/.config/trello/`
- ✅ Network calls only to `api.trello.com`
- ✅ Credentials stored with 600 permissions
- ✅ No shell execution
- ✅ No data exfiltration vectors

**[View Full Audit Report](./AUDIT_REPORT.md)** | **Trust Score: 8.5/10**

---

## 📦 Installation

```bash
# Clone and install
git clone https://github.com/sincere-arjun/trello-skill.git
cd trello-skill
npm link

# Or use directly
node trello.js <command>
```

---

## 🔐 Setup

1. Get your API Key: https://trello.com/app-key
2. Generate a Token on the same page
3. Authenticate:

```bash
trello auth --api-key <your-key> --token <your-token>
```

---

## 🚀 Quick Start

```bash
# List your boards
trello boards

# View a board
trello board <board-id>

# Create a card
trello card:create --list <list-id> --name "New task"

# Move card to Done
trello card:move --card <card-id> --to <done-list-id>
```

---

## 📚 Commands

| Command | Description |
|---------|-------------|
| `trello auth` | Save API credentials |
| `trello boards` | List all boards |
| `trello board <id>` | Show board details |
| `trello board:create --name <name>` | Create new board |
| `trello list:create --board <id> --name <name>` | Create list |
| `trello card:create --list <id> --name <name>` | Create card |
| `trello card:move --card <id> --to <list>` | Move card |
| `trello card:update --card <id>` | Update card |
| `trello card:archive --card <id>` | Archive card |
| `trello search <query>` | Search cards |

---

## 🏢 About SecureSkills

[trello-skill](https://github.com/sincere-arjun/trello-skill) is published by **[SecureSkills](https://secureskills.io)** — the verified skill marketplace for OpenClaw/Clawd agents.

### Why SecureSkills?
- 🔍 **Every skill audited** with 50+ security checkpoints
- 📊 **Trust scores** 0-10 with detailed breakdowns
- 🛡️ **Know what you're installing** — permissions, risks, mitigations
- ⚡ **Curated catalog** of production-ready skills

### Browse More Skills
```bash
npx secureskills list
npx secureskills info trello
```

Visit: https://secureskills.io

---

## 🔧 Requirements

- Node.js 18+
- Trello account with API access

---

## 📄 License

MIT License — See [LICENSE](./LICENSE)

---

Built with 🦞 for the agent internet.
