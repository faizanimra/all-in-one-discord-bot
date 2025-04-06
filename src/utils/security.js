import AutoMod from '../models/AutoMod.js';

// Cache for spam detection
const messageCache = new Map();
const spamCache = new Map();

export async function checkAntiSpam(message) {
    if (message.author.bot || !message.guild) return;

    try {
        const automod = await AutoMod.findOne({ guildId: message.guild.id });
        if (!automod?.enabled || !automod.features.antiSpam.enabled) return;

        // Check ignored channels and roles
        if (automod.ignoredChannels.includes(message.channel.id)) return;
        if (message.member.roles.cache.some(role => automod.ignoredRoles.includes(role.id))) return;

        const { maxMessages, timeWindow, punishment, muteDuration } = automod.features.antiSpam;
        const now = Date.now();

        // Initialize user's message history
        if (!messageCache.has(message.author.id)) {
            messageCache.set(message.author.id, []);
        }

        const userMessages = messageCache.get(message.author.id);
        userMessages.push(now);

        // Remove messages outside the time window
        const windowStart = now - (timeWindow * 1000);
        while (userMessages.length > 0 && userMessages[0] < windowStart) {
            userMessages.shift();
        }

        // Check if user has exceeded the message limit
        if (userMessages.length > maxMessages) {
            await handlePunishment(message, punishment, muteDuration, 'spam');
            userMessages.length = 0; // Clear the cache after punishment
        }
    } catch (error) {
        console.error('Error in anti-spam check:', error);
    }
}

export async function checkAntiLink(message) {
    if (message.author.bot || !message.guild) return;

    try {
        const automod = await AutoMod.findOne({ guildId: message.guild.id });
        if (!automod?.enabled || !automod.features.antiLink.enabled) return;

        if (automod.ignoredChannels.includes(message.channel.id)) return;
        if (message.member.roles.cache.some(role => automod.ignoredRoles.includes(role.id))) return;

        const { whitelistedDomains, punishment } = automod.features.antiLink;

        // Check for links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = message.content.match(urlRegex);

        if (links) {
            const hasIllegalLink = links.some(link => {
                const domain = new URL(link).hostname;
                return !whitelistedDomains.some(whitelist => domain.includes(whitelist));
            });

            if (hasIllegalLink) {
                await handlePunishment(message, punishment, 5, 'illegal link');
            }
        }
    } catch (error) {
        console.error('Error in anti-link check:', error);
    }
}

export async function checkBadWords(message) {
    if (message.author.bot || !message.guild) return;

    try {
        const automod = await AutoMod.findOne({ guildId: message.guild.id });
        if (!automod?.enabled || !automod.features.badWords.enabled) return;

        if (automod.ignoredChannels.includes(message.channel.id)) return;
        if (message.member.roles.cache.some(role => automod.ignoredRoles.includes(role.id))) return;

        const { words, punishment } = automod.features.badWords;

        const containsBadWord = words.some(word => 
            message.content.toLowerCase().includes(word.toLowerCase())
        );

        if (containsBadWord) {
            await handlePunishment(message, punishment, 5, 'bad word');
        }
    } catch (error) {
        console.error('Error in bad words check:', error);
    }
}

export async function checkMentionSpam(message) {
    if (message.author.bot || !message.guild) return;

    try {
        const automod = await AutoMod.findOne({ guildId: message.guild.id });
        if (!automod?.enabled || !automod.features.mentionSpam.enabled) return;

        if (automod.ignoredChannels.includes(message.channel.id)) return;
        if (message.member.roles.cache.some(role => automod.ignoredRoles.includes(role.id))) return;

        const { maxMentions, punishment } = automod.features.mentionSpam;

        if (message.mentions.users.size > maxMentions) {
            await handlePunishment(message, punishment, 5, 'mention spam');
        }
    } catch (error) {
        console.error('Error in mention spam check:', error);
    }
}

export async function checkCaps(message) {
    if (message.author.bot || !message.guild) return;

    try {
        const automod = await AutoMod.findOne({ guildId: message.guild.id });
        if (!automod?.enabled || !automod.features.caps.enabled) return;

        if (automod.ignoredChannels.includes(message.channel.id)) return;
        if (message.member.roles.cache.some(role => automod.ignoredRoles.includes(role.id))) return;

        const { percentage, minLength, punishment } = automod.features.caps;

        if (message.content.length >= minLength) {
            const capsCount = message.content.replace(/[^A-Z]/g, '').length;
            const capsPercentage = (capsCount / message.content.length) * 100;

            if (capsPercentage > percentage) {
                await handlePunishment(message, punishment, 5, 'excessive caps');
            }
        }
    } catch (error) {
        console.error('Error in caps check:', error);
    }
}

async function handlePunishment(message, punishment, duration, reason) {
    try {
        const automod = await AutoMod.findOne({ guildId: message.guild.id });

        switch (punishment) {
            case 'delete':
                await message.delete();
                break;

            case 'mute':
                await message.delete();
                await message.member.timeout(duration * 60 * 1000, `AutoMod: ${reason}`);
                break;

            case 'kick':
                await message.delete();
                await message.member.kick(`AutoMod: ${reason}`);
                break;

            case 'ban':
                await message.delete();
                await message.member.ban({ reason: `AutoMod: ${reason}` });
                break;
        }

        // Log the action if log channel is set
        if (automod.logChannel) {
            const logChannel = await message.guild.channels.fetch(automod.logChannel);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: 'AutoMod Action',
                        description: `**User:** ${message.author.tag}\n` +
                                  `**Action:** ${punishment}\n` +
                                  `**Reason:** ${reason}\n` +
                                  `**Channel:** ${message.channel}\n` +
                                  `**Message Content:** ${message.content}`,
                        color: 0xff0000,
                        timestamp: new Date()
                    }]
                });
            }
        }
    } catch (error) {
        console.error('Error handling punishment:', error);
    }
}
