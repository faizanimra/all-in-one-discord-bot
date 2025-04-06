import User from '../models/User.js';
import { EmbedBuilder } from 'discord.js';
import { translate } from '../utils/i18n.js';

const XP_COOLDOWN = 60000; // 1 minute cooldown between XP gains
const MIN_XP = 15;
const MAX_XP = 25;
const VOICE_XP_INTERVAL = 5; // minutes

// Cache for voice channel join times
const voiceStates = new Map();

export async function handleMessageXP(message) {
    if (message.author.bot || !message.guild) return;

    try {
        const user = await User.findOne({
            userId: message.author.id,
            guildId: message.guild.id
        });

        if (!user) return;

        const now = new Date();
        if (user.lastXpGain && now - user.lastXpGain < XP_COOLDOWN) return;

        // Calculate random XP
        const earnedXP = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;
        user.xp += earnedXP;
        user.lastXpGain = now;

        // Check for level up
        const oldLevel = user.level;
        const didLevelUp = user.checkLevelUp();

        await user.save();

        // Send level up message if applicable
        if (didLevelUp) {
            const embed = new EmbedBuilder()
                .setTitle('🎉 Level Up!')
                .setDescription(translate('levels.level_up', {
                    lng: user.language,
                    user: message.author.tag,
                    level: user.level
                }))
                .setColor('#00ff00')
                .setThumbnail(message.author.displayAvatarURL());

            // Try to send in the same channel, fall back to DM if no permission
            try {
                await message.channel.send({ embeds: [embed] });
            } catch (error) {
                try {
                    await message.author.send({ embeds: [embed] });
                } catch (dmError) {
                    console.error('Could not send level up message:', dmError);
                }
            }

            // Check for level roles if configured
            await checkLevelRoles(message.member, user.level);
        }
    } catch (error) {
        console.error('Error handling message XP:', error);
    }
}

export async function handleVoiceStateUpdate(oldState, newState) {
    // User joined a voice channel
    if (!oldState.channelId && newState.channelId) {
        voiceStates.set(newState.member.id, new Date());
    }
    // User left a voice channel
    else if (oldState.channelId && !newState.channelId) {
        const joinTime = voiceStates.get(oldState.member.id);
        if (!joinTime) return;

        voiceStates.delete(oldState.member.id);

        try {
            const user = await User.findOne({
                userId: oldState.member.id,
                guildId: oldState.guild.id
            });

            if (!user) return;

            // Calculate time spent in voice (in minutes)
            const timeSpent = Math.floor((new Date() - joinTime) / 60000);
            user.totalVoiceTime += timeSpent;

            // Award XP for voice time (every 5 minutes)
            const xpGained = Math.floor(timeSpent / VOICE_XP_INTERVAL) * MIN_XP;
            if (xpGained > 0) {
                user.xp += xpGained;
                const didLevelUp = user.checkLevelUp();

                if (didLevelUp) {
                    // Send level up DM
                    try {
                        const embed = new EmbedBuilder()
                            .setTitle('🎉 Level Up!')
                            .setDescription(translate('levels.level_up_voice', {
                                lng: user.language,
                                user: oldState.member.user.tag,
                                level: user.level
                            }))
                            .setColor('#00ff00');

                        await oldState.member.send({ embeds: [embed] });
                    } catch (error) {
                        console.error('Could not send voice level up DM:', error);
                    }

                    // Check for level roles
                    await checkLevelRoles(oldState.member, user.level);
                }
            }

            await user.save();
        } catch (error) {
            console.error('Error handling voice XP:', error);
        }
    }
}

async function checkLevelRoles(member, level) {
    try {
        // Get level roles configuration from guild settings
        const levelRoles = {
            5: 'Level 5',
            10: 'Level 10',
            20: 'Level 20',
            30: 'Level 30',
            50: 'Level 50',
            100: 'Level 100'
        };

        for (const [reqLevel, roleName] of Object.entries(levelRoles)) {
            if (level >= parseInt(reqLevel)) {
                const role = member.guild.roles.cache.find(r => r.name === roleName);
                if (role && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                }
            }
        }
    } catch (error) {
        console.error('Error handling level roles:', error);
    }
}
