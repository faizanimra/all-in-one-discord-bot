# All-In-One Discord Bot

[![CI/CD](https://github.com/madx900/all-in-one-discord-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/MADX900/all-in-one-discord-bot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

A comprehensive Discord bot with advanced moderation, music, leveling, and more.

## 🌟 Features

### 🛡️ Moderation System
- **AutoMod Features**
  - Anti-Spam Protection: Prevents message spam and duplicate content
  - Bad Words Filter: Customizable word blacklist with auto-deletion
  - Link Control: Whitelist/blacklist domains and auto-moderate links
  - Mention Spam Protection: Prevents mass mentioning of users/roles
  - Caps Filter: Controls excessive use of capital letters
  - Raid Protection: Automatic detection and prevention of raids

- **Manual Moderation**
  - Ban/Kick/Mute Commands
  - Warning System with History
  - Bulk Message Deletion
  - Channel Lockdown
  - Temporary Mutes/Bans
  - Moderation Logs

### 🎵 Music System
- **Playback Features**
  - YouTube Support
  - Spotify Integration
  - SoundCloud Support
  - Local File Playback
  - High Quality Audio

- **Music Controls**
  - Queue Management
  - Volume Control
  - Audio Filters (Bass boost, etc.)
  - Loop/Repeat Modes
  - Skip/Stop/Pause
  - Seek Function

### ⭐ Leveling System
- **XP Features**
  - Message XP Gain
  - Voice Activity XP
  - Custom XP Rates
  - Role Rewards
  - Level-up Notifications

- **Leaderboard System**
  - Server Rankings
  - Voice Time Tracking
  - Custom Rank Cards
  - Progress Display
  - Weekly/Monthly Resets

### 📊 Server Statistics
- **Tracking Features**
  - Message Analytics
  - Voice Activity Time
  - Member Join/Leave Tracking
  - Command Usage Stats
  - Channel Activity

- **Data Features**
  - Custom Charts
  - Data Export (JSON/CSV)
  - Growth Analytics
  - Activity Heatmaps
  - Trend Analysis

### 🎮 Fun & Games
- **Mini-Games**
  - Trivia
  - Hangman
  - Connect Four
  - Tic Tac Toe
  - Snake

- **Utility Features**
  - Custom Embeds
  - Polls
  - Reminders
  - Welcome Messages
  - Birthday Tracking

### 🎭 Role Management
- **Reaction Roles**
  - Multiple Roles per Message
  - Custom Emojis
  - Role Categories
  - Temporary Roles
  - Role Menus

- **Auto Roles**
  - Join Roles
  - Level-Based Roles
  - Time-Based Roles
  - Activity Roles
  - Voice Roles

### 🎫 Ticket System
- **Ticket Features**
  - Custom Categories
  - Auto-Response
  - Staff Roles
  - Ticket Logs
  - Transcript Export

### 🌍 Localization
- Multiple Language Support
- Easy Translation System
- Region-Specific Settings

## 🚀 Getting Started

1. Clone the repository
```bash
git clone https://github.com/madx900/all-in-one-discord-bot.git
cd all-in-one-discord-bot
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```env
BOT_TOKEN=your_bot_token
CLIENT_ID=your_client_id
MONGODB_URI=your_mongodb_uri
```

4. Run setup
```bash
npm run setup
```

5. Start the bot
```bash
npm run dev
```

## 📚 Documentation

Visit our [Documentation](https://madx900.github.io/all-in-one-discord-bot/) for:
- Detailed setup instructions
- Command reference
- Configuration guide
- API documentation
- Examples

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Support

Need help? Check our [FAQ](docs/wiki/FAQ.md) or open an issue.
