import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to lock (defaults to current channel)'))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for locking the channel'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });

            // Log the action
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '🔒 Channel Locked',
                        fields: [
                            { name: 'Channel', value: `${channel}`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Reason', value: reason }
                        ],
                        color: 0xFF0000,
                        timestamp: new Date()
                    }]
                });
            }

            // Send notification in the locked channel
            await channel.send({
                embeds: [{
                    title: '🔒 Channel Locked',
                    description: `This channel has been locked by ${interaction.user.tag}.\nReason: ${reason}`,
                    color: 0xFF0000
                }]
            });

            return interaction.reply({
                content: `Successfully locked ${channel}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to lock the channel.',
                ephemeral: true
            });
        }
    }
};
