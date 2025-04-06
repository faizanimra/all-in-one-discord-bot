import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set the slowmode for a channel')
        .addIntegerOption(option =>
            option
                .setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to set slowmode for (defaults to current channel)'))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for changing slowmode'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        try {
            await channel.setRateLimitPerUser(seconds, reason);

            // Format duration for display
            let duration;
            if (seconds === 0) {
                duration = 'disabled';
            } else if (seconds < 60) {
                duration = `${seconds} seconds`;
            } else if (seconds < 3600) {
                duration = `${Math.floor(seconds / 60)} minutes`;
            } else {
                duration = `${Math.floor(seconds / 3600)} hours`;
            }

            // Log the action
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '⏱️ Slowmode Changed',
                        fields: [
                            { name: 'Channel', value: `${channel}`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Duration', value: duration },
                            { name: 'Reason', value: reason }
                        ],
                        color: 0x00FFFF,
                        timestamp: new Date()
                    }]
                });
            }

            // Send notification in the affected channel
            if (seconds > 0) {
                await channel.send({
                    embeds: [{
                        title: '⏱️ Slowmode Enabled',
                        description: `Slowmode has been set to ${duration} by ${interaction.user.tag}.\nReason: ${reason}`,
                        color: 0x00FFFF
                    }]
                });
            }

            return interaction.reply({
                content: `Successfully ${seconds === 0 ? 'disabled' : 'set'} slowmode ${seconds > 0 ? `to ${duration}` : ''} in ${channel}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to set the slowmode.',
                ephemeral: true
            });
        }
    }
};
