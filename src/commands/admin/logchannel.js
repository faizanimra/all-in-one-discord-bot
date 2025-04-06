import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import AutoMod from '../../models/AutoMod.js';

export default {
    data: new SlashCommandBuilder()
        .setName('logchannel')
        .setDescription('Manage automod log channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove the log channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current log channel')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let automod = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!automod) {
                automod = new AutoMod({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'set': {
                    const channel = interaction.options.getChannel('channel');

                    // Check if bot has permission to send messages in the channel
                    const permissions = channel.permissionsFor(interaction.client.user);
                    if (!permissions.has('SendMessages') || !permissions.has('ViewChannel')) {
                        return interaction.reply({
                            content: translate('automod.log_channel_no_perms', {
                                lng: userLang,
                                channel: channel.name
                            }),
                            ephemeral: true
                        });
                    }

                    automod.logChannelId = channel.id;
                    await automod.save();

                    // Send test message to verify permissions
                    await channel.send({
                        content: translate('automod.log_channel_test', { lng: userLang })
                    });

                    await interaction.reply({
                        content: translate('automod.log_channel_set', {
                            lng: userLang,
                            channel: channel.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    if (!automod.logChannelId) {
                        return interaction.reply({
                            content: translate('automod.no_log_channel', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    automod.logChannelId = null;
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.log_channel_removed', { lng: userLang }),
                        ephemeral: true
                    });
                    break;
                }

                case 'view': {
                    if (!automod.logChannelId) {
                        return interaction.reply({
                            content: translate('automod.no_log_channel', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    const channel = interaction.guild.channels.cache.get(automod.logChannelId);
                    if (!channel) {
                        // Channel was deleted
                        automod.logChannelId = null;
                        await automod.save();

                        return interaction.reply({
                            content: translate('automod.log_channel_deleted', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    await interaction.reply({
                        content: translate('automod.current_log_channel', {
                            lng: userLang,
                            channel: channel.name
                        }),
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing log channel:', error);
            await interaction.reply({
                content: translate('common.error', {
                    lng: userLang,
                    error: error.message
                }),
                ephemeral: true
            });
        }
    }
};
