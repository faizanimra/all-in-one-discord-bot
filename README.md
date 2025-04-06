# All-In-One Discord Bot

[![CI/CD](https://github.com/MAD900/all-in-one-discord-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/MAD900/all-in-one-discord-bot/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/MAD900/all-in-one-discord-bot/branch/main/graph/badge.svg)](https://codecov.io/gh/MAD900/all-in-one-discord-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A feature-rich Discord bot with moderation, music, leveling, and more.

## Features

- **AutoMod**
  - Anti-spam protection
  - Bad words filter
  - Link control
  - Mention spam protection
  - Caps detection
  - Configurable punishments

- **Level System**
  - Message XP
  - Voice activity XP
  - Customizable rates
  - Leaderboards

- **Server Statistics**
  - Message tracking
  - Voice activity
  - Member analytics
  - Command usage
  - Data export (JSON/CSV)

- **Reaction Roles**
  - Multiple roles per message
  - Role persistence
  - Automatic sync

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/MAD900/all-in-one-discord-bot.git
   cd all-in-one-discord-bot
   npm install
   ```

2. **Setup**
   ```bash
   npm run setup
   ```

3. **Start Bot**
   ```bash
   # Development
   npm run dev

   # Production
   npm run deploy
   ```

## Configuration

### Environment Variables

Create a `.env` file:
```env
BOT_TOKEN=your_bot_token
CLIENT_ID=your_client_id
MONGODB_URI=your_mongodb_uri

# Optional Settings
GUILD_ID=development_server_id
MOD_LOGS_CHANNEL=channel_id
ERROR_LOGS_CHANNEL=channel_id
```

### AutoMod Settings
```env
AUTOMOD_MAX_MENTIONS=5
AUTOMOD_MAX_MESSAGES=5
AUTOMOD_MAX_LINKS=3
AUTOMOD_MAX_CAPS_PERCENT=70
```

### XP Settings
```env
XP_PER_MESSAGE=25
XP_PER_VOICE_MINUTE=10
XP_COOLDOWN_SECONDS=60
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:integration` - Run integration tests
- `npm run lint` - Check code style
- `npm run format` - Format code
- `npm run validate` - Validate environment
- `npm run monitor` - Start monitoring
- `npm run backup` - Create database backup
- `npm run restore` - Restore database backup

### Testing

```bash
# Unit Tests
npm test

# Integration Tests
npm run test:integration

# Coverage Report
npm run test:coverage
```

### Monitoring

```bash
# Direct monitoring
npm run monitor

# PM2 monitoring
npm run monitor:pm2
pm2 monit
```

### Database Management

```bash
# Create backup
npm run backup

# Restore backup
npm run restore
```

## Deployment

1. Set up GitHub repository
2. Configure GitHub Secrets:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DEPLOY_SSH_KEY`
   - `DEPLOY_USER`
   - `DEPLOY_HOST`
   - `DEPLOY_PATH`

3. Push to main branch:
   ```bash
   git push origin main
   ```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details
