import ServerStats from '../models/ServerStats.js';

export async function updateMessageStats(message) {
    if (!message.guild || message.author.bot) return;

    try {
        const stats = await ServerStats.findOneAndUpdate(
            { guildId: message.guild.id },
            {
                $inc: { totalMessages: 1 },
                $set: {
                    [`channelStats.${message.channel.id}.lastMessage`]: new Date()
                }
            },
            { upsert: true, new: true }
        );

        // Update channel stats
        const channelIndex = stats.channelStats.findIndex(
            ch => ch.channelId === message.channel.id
        );

        if (channelIndex === -1) {
            stats.channelStats.push({
                channelId: message.channel.id,
                messageCount: 1,
                lastMessage: new Date()
            });
        } else {
            stats.channelStats[channelIndex].messageCount++;
            stats.channelStats[channelIndex].lastMessage = new Date();
        }

        await stats.save();
    } catch (error) {
        console.error('Error updating message stats:', error);
    }
}

export async function updateMemberStats(member, action) {
    if (!member.guild) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        const stats = await ServerStats.findOne({ guildId: member.guild.id });
        if (!stats) return;

        // Update member activity for today
        const activityIndex = stats.memberActivity.findIndex(
            day => day.date.getTime() === today.getTime()
        );

        if (activityIndex === -1) {
            stats.memberActivity.push({
                date: today,
                joins: action === 'join' ? 1 : 0,
                leaves: action === 'leave' ? 1 : 0
            });
        } else {
            if (action === 'join') {
                stats.memberActivity[activityIndex].joins++;
            } else {
                stats.memberActivity[activityIndex].leaves++;
            }
        }

        // Update total members
        stats.totalMembers = await member.guild.memberCount;
        await stats.save();
    } catch (error) {
        console.error('Error updating member stats:', error);
    }
}

export async function updateCommandStats(interaction) {
    if (!interaction.guild) return;

    try {
        await ServerStats.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { $inc: { totalCommands: 1 } },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error updating command stats:', error);
    }
}

export async function updateVoiceStats(oldState, newState) {
    if (!oldState.guild) return;

    try {
        // User joined a voice channel
        if (!oldState.channelId && newState.channelId) {
            newState.member.voiceJoinTime = Date.now();
        }
        // User left a voice channel
        else if (oldState.channelId && !newState.channelId) {
            const joinTime = oldState.member.voiceJoinTime;
            if (!joinTime) return;

            const duration = Math.floor((Date.now() - joinTime) / 60000); // Convert to minutes
            await ServerStats.findOneAndUpdate(
                { guildId: oldState.guild.id },
                { $inc: { totalVoiceMinutes: duration } },
                { upsert: true }
            );

            delete oldState.member.voiceJoinTime;
        }
    } catch (error) {
        console.error('Error updating voice stats:', error);
    }
}

export async function updateActiveMembers(guild) {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const stats = await ServerStats.findOne({ guildId: guild.id });
        if (!stats) return;

        // Count members who have sent a message in the last 24 hours
        const activeCount = stats.channelStats.reduce((count, channel) => {
            return count + (channel.lastMessage > twentyFourHoursAgo ? 1 : 0);
        }, 0);

        stats.activeMembers = activeCount;
        await stats.save();
    } catch (error) {
        console.error('Error updating active members:', error);
    }
}
