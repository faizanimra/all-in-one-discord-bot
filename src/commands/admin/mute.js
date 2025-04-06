import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import User from '../../models/User.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user for a specified duration')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Mute duration (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for muting'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const durationString = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        // Parse duration
        const durationRegex = /^(\d+)(m|h|d)$/;
        const match = durationString.match(durationRegex);
        
        if (!match) {
            return interaction.reply({
                content: 'Invalid duration format. Use format: number + m/h/d (e.g., 30m, 1h, 1d)',
                ephemeral: true
            });
        }

        const [, time, unit] = match;
        const timeInMs = {
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000
        }[unit] * parseInt(time);

        const targetMember = await interaction.guild.members.fetch(target.id);
        
        if (!targetMember.moderatable) {
            return interaction.reply({
                content: 'I cannot mute this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        try {
            // Update database
            await User.findOneAndUpdate(
                { userId: target.id, guildId: interaction.guild.id },
                {
                    $set: {
                        isMuted: true,
                        muteExpires: new Date(Date.now() + timeInMs)
                    }
                },
                { upsert: true }
            );

            // Timeout the member
            await targetMember.timeout(timeInMs, reason);

            // Log the mute
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '🔇 User Muted',
                        fields: [
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Duration', value: durationString },
                            { name: 'Reason', value: reason }
                        ],
                        color: 0xFFFF00,
                        timestamp: new Date()
                    }]
                });
            }

            return interaction.reply({
                content: `Successfully muted ${target.tag} for ${durationString}. Reason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to mute the user.',
                ephemeral: true
            });
        }
    }
};
