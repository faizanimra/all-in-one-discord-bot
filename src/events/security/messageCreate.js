import { Collection } from 'discord.js';
import Guild from '../../models/Guild.js';
import User from '../../models/User.js';

const spamMap = new Collection();
const linkRegex = /(https?:\/\/[^\s]+)/g;
const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[^\s]+/g;

export default {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        const guildSettings = await Guild.findOne({ guildId: message.guild.id });
        if (!guildSettings) return;

        const { security } = guildSettings;

        // Anti-spam check
        if (security.antiSpam) {
            const userId = message.author.id;
            if (!spamMap.has(userId)) {
                spamMap.set(userId, {
                    messages: [],
                    warnings: 0,
                    timeout: false
                });
            }

            const userData = spamMap.get(userId);
            const now = Date.now();
            const messageTimestamps = userData.messages;
            
            messageTimestamps.push(now);

            // Remove messages older than the time window
            const timeWindow = security.timeWindow || 5000; // 5 seconds default
            while (messageTimestamps.length && messageTimestamps[0] <= now - timeWindow) {
                messageTimestamps.shift();
            }

            // Check if user is spamming
            if (messageTimestamps.length >= (security.maxMessages || 5)) {
                if (!userData.timeout) {
                    userData.warnings++;
                    userData.timeout = true;

                    // Mute user temporarily
                    try {
                        await message.member.timeout(30000, 'Spam detection');
                        await message.channel.send(`🛡️ ${message.author}, you have been muted for 30 seconds due to spamming.`);

                        // Log the action
                        const logChannel = message.guild.channels.cache.get(guildSettings.settings.modLogChannel);
                        if (logChannel) {
                            await logChannel.send({
                                embeds: [{
                                    title: '🛡️ Anti-Spam Action',
                                    description: `${message.author.tag} has been muted for spamming`,
                                    fields: [
                                        { name: 'Channel', value: message.channel.toString() },
                                        { name: 'Warning Count', value: userData.warnings.toString() }
                                    ],
                                    color: 0xFF0000,
                                    timestamp: new Date()
                                }]
                            });
                        }

                        // Reset after timeout
                        setTimeout(() => {
                            userData.timeout = false;
                            userData.messages = [];
                        }, 30000);

                        // If user has been warned multiple times, take stronger action
                        if (userData.warnings >= 3) {
                            await message.member.timeout(3600000, 'Repeated spam violations'); // 1 hour
                            await message.channel.send(`🛡️ ${message.author} has been muted for 1 hour due to repeated spam violations.`);
                        }
                    } catch (error) {
                        console.error('Error in anti-spam system:', error);
                    }
                }
                return;
            }
        }

        // Anti-link check
        if (security.antiLink && message.content.match(linkRegex)) {
            const isInviteLink = message.content.match(inviteRegex);
            const hasPermission = message.member.permissions.has('ManageMessages');
            
            if (!hasPermission && (isInviteLink || !security.whitelistedLinks?.some(link => message.content.includes(link)))) {
                try {
                    await message.delete();
                    const warning = await message.channel.send(`🛡️ ${message.author}, sending links is not allowed in this server!`);
                    setTimeout(() => warning.delete(), 5000);

                    // Log the action
                    const logChannel = message.guild.channels.cache.get(guildSettings.settings.modLogChannel);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [{
                                title: '🛡️ Anti-Link Action',
                                description: `Deleted a message containing a link from ${message.author.tag}`,
                                fields: [
                                    { name: 'Channel', value: message.channel.toString() },
                                    { name: 'Content', value: message.content.slice(0, 1000) }
                                ],
                                color: 0xFF0000,
                                timestamp: new Date()
                            }]
                        });
                    }
                } catch (error) {
                    console.error('Error in anti-link system:', error);
                }
            }
        }

        // Blacklisted words check
        if (security.blacklistedWords?.length > 0) {
            const content = message.content.toLowerCase();
            const hasBlacklistedWord = security.blacklistedWords.some(word => 
                content.includes(word.toLowerCase())
            );

            if (hasBlacklistedWord && !message.member.permissions.has('ManageMessages')) {
                try {
                    await message.delete();
                    const warning = await message.channel.send(`🛡️ ${message.author}, your message contained prohibited words!`);
                    setTimeout(() => warning.delete(), 5000);

                    // Log the action
                    const logChannel = message.guild.channels.cache.get(guildSettings.settings.modLogChannel);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [{
                                title: '🛡️ Word Filter Action',
                                description: `Deleted a message containing blacklisted words from ${message.author.tag}`,
                                fields: [
                                    { name: 'Channel', value: message.channel.toString() }
                                ],
                                color: 0xFF0000,
                                timestamp: new Date()
                            }]
                        });
                    }
                } catch (error) {
                    console.error('Error in word filter system:', error);
                }
            }
        }
    }
};
