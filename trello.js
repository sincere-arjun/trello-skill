#!/usr/bin/env node
/**
 * Trello Skill for OpenClaw/Clawd
 * Manage Trello boards, lists, and cards via CLI
 * 
 * Usage: node trello.js <command> [args]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(process.env.HOME || '/root', '.config', 'trello');
const CONFIG_FILE = path.join(CONFIG_DIR, 'credentials.json');

// ANSI colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Load credentials
function loadCredentials() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`${C.red}Error: Trello credentials not found.${C.reset}`);
    console.error(`Run: trello auth --api-key <key> --token <token>`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// Save credentials
function saveCredentials(apiKey, token) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ apiKey, token }, null, 2));
  fs.chmodSync(CONFIG_FILE, 0o600);
  console.log(`${C.green}✓ Credentials saved${C.reset}`);
}

// Make Trello API request
function apiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const creds = loadCredentials();
    const separator = endpoint.includes('?') ? '&' : '?';
    const queryString = `${separator}key=${creds.apiKey}&token=${creds.token}`;
    const url = `https://api.trello.com/1${endpoint}${queryString}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(json.message || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Commands
const commands = {
  // Authentication
  auth: async (args) => {
    const apiKey = args['--api-key'] || args['-k'];
    const token = args['--token'] || args['-t'];
    
    if (!apiKey || !token) {
      console.error(`${C.red}Error: --api-key and --token required${C.reset}`);
      console.error(`Get your credentials at: https://trello.com/app-key`);
      process.exit(1);
    }
    
    // Test credentials with a direct request
    try {
      const testUrl = `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`;
      const https = require('https');
      
      await new Promise((resolve, reject) => {
        https.get(testUrl, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(body));
            } else {
              reject(new Error(JSON.parse(body).message || `HTTP ${res.statusCode}`));
            }
          });
        }).on('error', reject);
      });
      
      saveCredentials(apiKey, token);
      console.log(`${C.green}✓ Authenticated with Trello${C.reset}`);
    } catch (e) {
      console.error(`${C.red}Authentication failed: ${e.message}${C.reset}`);
      process.exit(1);
    }
  },

  // List boards
  boards: async () => {
    const boards = await apiRequest('/members/me/boards');
    console.log(`\n${C.bold}${C.cyan}Your Trello Boards:${C.reset}\n`);
    boards.forEach(b => {
      const privacy = b.prefs.permissionLevel === 'private' ? '🔒' : '🌐';
      console.log(`  ${privacy} ${C.bold}${b.name}${C.reset}`);
      console.log(`     ID: ${C.dim}${b.id}${C.reset}`);
      console.log(`     URL: ${C.dim}${b.shortUrl}${C.reset}`);
      console.log();
    });
  },

  // Get board details
  board: async (args) => {
    const boardId = args['--id'] || args[0];
    if (!boardId) {
      console.error(`${C.red}Error: Board ID required${C.reset}`);
      console.error(`Usage: trello board <board-id>`);
      process.exit(1);
    }

    const [board, lists] = await Promise.all([
      apiRequest(`/boards/${boardId}`),
      apiRequest(`/boards/${boardId}/lists?cards=open`)
    ]);

    console.log(`\n${C.bold}${C.cyan}${board.name}${C.reset}`);
    console.log(`${C.dim}${board.desc || 'No description'}${C.reset}\n`);
    
    lists.forEach(list => {
      console.log(`${C.bold}${list.name}${C.reset} (${list.cards.length} cards)`);
      list.cards.forEach(card => {
        const due = card.due ? ` 📅 ${new Date(card.due).toLocaleDateString()}` : '';
        const labels = card.labels?.map(l => `[${l.name}]`).join(' ') || '';
        console.log(`  • ${card.name}${due} ${C.dim}${labels}${C.reset}`);
        console.log(`    ID: ${C.dim}${card.id}${C.reset}`);
      });
      console.log();
    });
  },

  // Create board
  'board:create': async (args) => {
    const name = args['--name'] || args['-n'] || args[0];
    if (!name) {
      console.error(`${C.red}Error: Board name required${C.reset}`);
      process.exit(1);
    }

    const board = await apiRequest('/boards', 'POST', {
      name,
      desc: args['--desc'] || '',
      defaultLists: args['--no-lists'] ? false : true
    });

    console.log(`${C.green}✓ Created board:${C.reset} ${board.name}`);
    console.log(`  URL: ${board.shortUrl}`);
    console.log(`  ID: ${board.id}`);
  },

  // Create list
  'list:create': async (args) => {
    const boardId = args['--board'] || args['-b'];
    const name = args['--name'] || args['-n'] || args[0];
    
    if (!boardId || !name) {
      console.error(`${C.red}Error: --board and --name required${C.reset}`);
      process.exit(1);
    }

    const list = await apiRequest('/lists', 'POST', {
      name,
      idBoard: boardId
    });

    console.log(`${C.green}✓ Created list:${C.reset} ${list.name}`);
    console.log(`  ID: ${list.id}`);
  },

  // Create card
  'card:create': async (args) => {
    const listId = args['--list'] || args['-l'];
    const name = args['--name'] || args['-n'] || args[0];
    
    if (!listId || !name) {
      console.error(`${C.red}Error: --list and --name required${C.reset}`);
      process.exit(1);
    }

    const card = await apiRequest('/cards', 'POST', {
      name,
      desc: args['--desc'] || args['-d'] || '',
      idList: listId,
      due: args['--due'] || null
    });

    console.log(`${C.green}✓ Created card:${C.reset} ${card.name}`);
    console.log(`  ID: ${card.id}`);
    console.log(`  URL: ${card.shortUrl}`);
  },

  // Move card
  'card:move': async (args) => {
    const cardId = args['--card'] || args['-c'];
    const listId = args['--to'] || args['-t'];
    
    if (!cardId || !listId) {
      console.error(`${C.red}Error: --card and --to (list ID) required${C.reset}`);
      process.exit(1);
    }

    const card = await apiRequest(`/cards/${cardId}`, 'PUT', {
      idList: listId
    });

    console.log(`${C.green}✓ Moved card:${C.reset} ${card.name}`);
  },

  // Update card
  'card:update': async (args) => {
    const cardId = args['--card'] || args['-c'];
    if (!cardId) {
      console.error(`${C.red}Error: --card required${C.reset}`);
      process.exit(1);
    }

    const updates = {};
    if (args['--name'] || args['-n']) updates.name = args['--name'] || args['-n'];
    if (args['--desc'] || args['-d']) updates.desc = args['--desc'] || args['-d'];
    if (args['--due']) updates.due = args['--due'];

    const card = await apiRequest(`/cards/${cardId}`, 'PUT', updates);
    console.log(`${C.green}✓ Updated card:${C.reset} ${card.name}`);
  },

  // Archive card
  'card:archive': async (args) => {
    const cardId = args['--card'] || args['-c'] || args[0];
    if (!cardId) {
      console.error(`${C.red}Error: Card ID required${C.reset}`);
      process.exit(1);
    }

    await apiRequest(`/cards/${cardId}`, 'PUT', { closed: true });
    console.log(`${C.green}✓ Card archived${C.reset}`);
  },

  // Search
  search: async (args) => {
    const query = args[0] || args['--query'] || args['-q'];
    if (!query) {
      console.error(`${C.red}Error: Search query required${C.reset}`);
      process.exit(1);
    }

    const results = await apiRequest(`/search?query=${encodeURIComponent(query)}&cards_limit=10`);
    
    if (results.cards?.length) {
      console.log(`\n${C.bold}${C.cyan}Cards:${C.reset}`);
      results.cards.forEach(c => {
        console.log(`  • ${c.name}`);
        console.log(`    Board: ${c.board.name} | List: ${c.list.name}`);
      });
    }
  },

  // Whoami
  whoami: async () => {
    const member = await apiRequest('/members/me');
    console.log(`${C.bold}${member.fullName}${C.reset} (@${member.username})`);
    console.log(`Email: ${member.email}`);
    console.log(`Boards: ${member.idBoards?.length || 0}`);
  },

  // Help
  help: () => {
    console.log(`${C.bold}Trello Skill for OpenClaw/Clawd${C.reset}\n`);
    console.log(`${C.bold}Setup:${C.reset}`);
    console.log(`  trello auth --api-key <key> --token <token>  Authenticate with Trello`);
    console.log();
    console.log(`${C.bold}Boards:${C.reset}`);
    console.log(`  trello boards                                  List your boards`);
    console.log(`  trello board <board-id>                        Show board with lists/cards`);
    console.log(`  trello board:create --name <name>              Create a new board`);
    console.log();
    console.log(`${C.bold}Lists:${C.reset}`);
    console.log(`  trello list:create --board <id> --name <name>  Create a list`);
    console.log();
    console.log(`${C.bold}Cards:${C.reset}`);
    console.log(`  trello card:create --list <id> --name <name>   Create a card`);
    console.log(`  trello card:move --card <id> --to <list-id>    Move card to list`);
    console.log(`  trello card:update --card <id> --name <name>   Update card`);
    console.log(`  trello card:archive --card <id>                Archive card`);
    console.log();
    console.log(`${C.bold}Other:${C.reset}`);
    console.log(`  trello search <query>                          Search cards`);
    console.log(`  trello whoami                                  Show current user`);
    console.log();
    console.log(`${C.dim}Get API credentials: https://trello.com/app-key${C.reset}`);
  }
};

// Parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const params = {};
  
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i];
      const value = args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : true;
      params[key] = value;
      if (value !== true) i++;
    } else if (args[i].startsWith('-')) {
      const key = args[i];
      const value = args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : true;
      params[key] = value;
      if (value !== true) i++;
    } else {
      // Positional arg
      if (!params[0]) params[0] = args[i];
      else if (!params[1]) params[1] = args[i];
    }
  }
  
  return { cmd, params };
}

// Main
async function main() {
  const { cmd, params } = parseArgs();
  
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    commands.help();
    return;
  }

  if (cmd === 'auth') {
    await commands.auth(params);
    return;
  }

  if (!commands[cmd]) {
    console.error(`${C.red}Unknown command: ${cmd}${C.reset}`);
    console.error(`Run 'trello help' for usage`);
    process.exit(1);
  }

  try {
    await commands[cmd](params);
  } catch (e) {
    console.error(`${C.red}Error: ${e.message}${C.reset}`);
    process.exit(1);
  }
}

main();
