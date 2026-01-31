# trello 🗂️

Manage Trello boards, lists, and cards from OpenClaw/Clawd.

## Install

```bash
# From this directory
npm link

# Or use directly
node /root/clawd/skills/trello/trello.js <command>
```

## Setup

1. Get your API Key: https://trello.com/app-key
2. Generate a Token (on the same page after getting API key)
3. Authenticate:

```bash
trello auth --api-key <your-api-key> --token <your-token>
```

Credentials are stored in `~/.config/trello/credentials.json`.

## Commands

### Authentication
```bash
trello auth --api-key <key> --token <token>   # Save credentials
trello whoami                                  # Show current user
```

### Boards
```bash
trello boards                           # List all boards
trello board <board-id>                 # Show board details with cards
trello board:create --name "Project"    # Create new board
```

### Lists
```bash
trello list:create --board <board-id> --name "To Do"
```

### Cards
```bash
# Create a card
trello card:create --list <list-id> --name "Task name" --desc "Description"

# Create with due date
trello card:create --list <list-id> --name "Task" --due "2026-02-01"

# Move card to another list
trello card:move --card <card-id> --to <list-id>

# Update card
trello card:update --card <card-id> --name "New name" --desc "New desc"

# Archive card
trello card:archive --card <card-id>
```

### Search
```bash
trello search "project name"
```

## Security

- Credentials stored with 600 permissions (user-only)
- API token has same permissions as your Trello account
- Keep your token private — it grants full access to your boards

## Examples

### Quick task creation workflow
```bash
# 1. Find your board
$ trello boards
🔒 My Project
   ID: 5f3a2b1c...

# 2. View board to get list IDs
$ trello board 5f3a2b1c
To Do (3 cards)
  • Task 1
    ID: 5f3a2b1d...
Doing (1 cards)
Done (5 cards)

# 3. Create a card in To Do
trello card:create --list <todo-list-id> --name "Review PR" --desc "Check the new feature"

# 4. Move to Done when complete
trello card:move --card <card-id> --to <done-list-id>
```

## API Reference

This skill uses the Trello REST API v1:
https://developer.atlassian.com/cloud/trello/rest/

## Troubleshooting

**"Authentication required" error**
- Run `trello auth` with valid credentials
- Check your token hasn't expired (they don't expire by default)

**"Invalid key" error**
- Verify your API key at https://trello.com/app-key
- Make sure you're using the token, not the secret

**Rate limiting**
- Trello allows 300 requests per 10 seconds per token
- The skill will show an error if you hit limits
