# Getting Started

## Prerequisites

Before setting up the bot, ensure you have:

1. Node.js 16.x or higher installed
2. MongoDB database set up
3. Discord Bot Token
4. Basic understanding of Discord bot permissions

## Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/MAD900/all-in-one-discord-bot.git
cd all-in-one-discord-bot
npm install
```

2. **Configure Environment**
Create a `.env` file:
```env
BOT_TOKEN=your_bot_token
CLIENT_ID=your_client_id
MONGODB_URI=your_mongodb_uri
```

3. **Run Setup**
```bash
npm run setup
```

4. **Start the Bot**
```bash
npm run dev
```

## Bot Permissions

The bot requires these permissions:
- Manage Messages
- Manage Roles
- Kick Members
- Ban Members
- View Channels
- Send Messages
- Manage Channels
- Connect
- Speak

## Initial Configuration

1. **Set Admin Role**
```
/config admin role @Admin
```

2. **Set Log Channel**
```
/config log #bot-logs
```

3. **Enable Features**
```
/automod enable
/leveling enable
```

## Next Steps

1. Configure [AutoMod](AutoMod.md)
2. Set up [Leveling](Leveling.md)
3. Configure [Music](Music-Commands.md)
4. Set up [Statistics](Statistics.md)

## Common Issues

See our [Troubleshooting](Troubleshooting.md) guide for common issues and solutions.

## Support

Need help? Check our [FAQ](FAQ.md) or join our support server.
