# Bot Setup Guide

## Prerequisites

1. Node.js 16.x or higher
2. MongoDB database
3. Discord Bot Token
4. Discord Application with required intents:
   - GUILDS
   - GUILD_MEMBERS
   - GUILD_MESSAGES
   - GUILD_MESSAGE_REACTIONS
   - GUILD_VOICE_STATES

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/MAD900/all-in-one-discord-bot.git
cd all-in-one-discord-bot
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a \`.env\` file:
\`\`\`env
BOT_TOKEN=your_bot_token
CLIENT_ID=your_client_id
MONGODB_URI=your_mongodb_uri
\`\`\`

4. Run the setup script:
\`\`\`bash
npm run setup
\`\`\`

## Configuration

### AutoMod Settings

\`\`\`json
{
  "spam": {
    "enabled": true,
    "maxMessages": 5,
    "interval": 5000
  },
  "mentions": {
    "enabled": true,
    "maxMentions": 3
  },
  "links": {
    "enabled": true,
    "whitelist": []
  }
}
\`\`\`

### Leveling System

\`\`\`json
{
  "messageXP": {
    "min": 15,
    "max": 25,
    "cooldown": 60
  },
  "voiceXP": {
    "perMinute": 10,
    "minActivity": 5
  }
}
\`\`\`

## Running the Bot

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm start
\`\`\`

### PM2 (Recommended for production)
\`\`\`bash
npm run deploy
\`\`\`

## Monitoring

1. View logs:
\`\`\`bash
npm run logs
\`\`\`

2. Check performance:
\`\`\`bash
npm run monitor
\`\`\`

3. Run benchmarks:
\`\`\`bash
npm run benchmark
\`\`\`

## Backup & Restore

1. Create backup:
\`\`\`bash
npm run backup
\`\`\`

2. Restore from backup:
\`\`\`bash
npm run restore <backup-file>
\`\`\`

## Troubleshooting

1. Reset configuration:
\`\`\`bash
npm run reset-config
\`\`\`

2. Validate setup:
\`\`\`bash
npm run validate
\`\`\`

3. Check system requirements:
\`\`\`bash
npm run check-system
\`\`\`
