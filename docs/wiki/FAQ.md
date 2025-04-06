# Frequently Asked Questions

## General Questions

### Q: How do I invite the bot to my server?
A: Use the OAuth2 URL generator in your Discord Developer Portal. Select the 'bot' and 'applications.commands' scopes, then select the required permissions.

### Q: What are the minimum permissions needed?
A: The bot needs:
- Manage Messages (for AutoMod)
- Manage Roles (for leveling rewards)
- Send Messages
- View Channels
- Connect (for music)
- Speak (for music)

### Q: Can I run multiple instances of the bot?
A: Yes, but ensure each instance has:
- Different bot tokens
- Different client IDs
- Separate MongoDB databases

## AutoMod

### Q: Why isn't AutoMod working?
Common reasons:
1. Bot lacks required permissions
2. Channel/role is in ignore list
3. Filter is disabled

### Q: Can I customize filter actions?
A: Yes, use `/automod config` to set:
- Warning thresholds
- Punishment types
- Duration of timeouts

## Leveling System

### Q: Why aren't users getting XP?
Check:
1. Leveling is enabled
2. User isn't in cooldown
3. Channel isn't blacklisted

### Q: How is XP calculated?
A: Default formula:
- Messages: 15-25 XP per message
- Voice: 10 XP per minute
- Custom multipliers available

## Music System

### Q: Why won't the bot play music?
Check:
1. Bot has voice permissions
2. Valid URL/search query
3. Voice channel isn't full

### Q: What music sources are supported?
- YouTube
- Spotify
- SoundCloud
- Direct links

## Statistics

### Q: How long is data kept?
A: Server statistics are kept for:
- Messages: 30 days
- Voice activity: 30 days
- Member events: 90 days

### Q: Can I export data?
A: Yes, use:
- `/stats export json`
- `/stats export csv`

## Technical Issues

### Q: Bot is offline/crashing
Check:
1. Valid token
2. MongoDB connection
3. Node.js version
4. Error logs

### Q: High memory usage
Solutions:
1. Enable garbage collection
2. Adjust cache settings
3. Update Node.js
4. Check for memory leaks

## Development

### Q: How do I add custom commands?
1. Create command file in src/commands
2. Register in commandHandler
3. Deploy slash commands

### Q: Can I modify the source code?
A: Yes, but:
1. Fork the repository
2. Follow contribution guidelines
3. Maintain documentation
4. Credit original source
