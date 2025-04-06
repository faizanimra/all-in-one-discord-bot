import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to unlock (defaults to current channel)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            });

            // Log the action
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '🔓 Channel Unlocked',
                        fields: [
                            { name: 'Channel', value: `${channel}`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
                        ],
                        color: 0x00FF00,
                        timestamp: new Date()
                    }]
                });
            }

            // Send notification in the unlocked channel
            await channel.send({
                embeds: [{
                    title: '🔓 Channel Unlocked',
                    description: `This channel has been unlocked by ${interaction.user.tag}.`,
                    color: 0x00FF00
                }]
            });

            return interaction.reply({
                content: `Successfully unlocked ${channel}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to unlock the channel.',
                ephemeral: true
            });
        }
    }
};
