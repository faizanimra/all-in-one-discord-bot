import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import AutoMod from '../../models/AutoMod.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ignoredchannels')
        .setDescription('Manage channels ignored by automod')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a channel to ignored list')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to ignore')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a channel from ignored list')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to remove')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all ignored channels')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let automod = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!automod) {
                automod = new AutoMod({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'add': {
                    const channel = interaction.options.getChannel('channel');

                    if (automod.ignoredChannels.includes(channel.id)) {
                        return interaction.reply({
                            content: translate('automod.channel_already_ignored', {
                                lng: userLang,
                                channel: channel.name
                            }),
                            ephemeral: true
                        });
                    }

                    automod.ignoredChannels.push(channel.id);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.channel_ignored', {
                            lng: userLang,
                            channel: channel.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    const channel = interaction.options.getChannel('channel');

                    if (!automod.ignoredChannels.includes(channel.id)) {
                        return interaction.reply({
                            content: translate('automod.channel_not_ignored', {
                                lng: userLang,
                                channel: channel.name
                            }),
                            ephemeral: true
                        });
                    }

                    automod.ignoredChannels = automod.ignoredChannels.filter(id => id !== channel.id);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.channel_unignored', {
                            lng: userLang,
                            channel: channel.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'list': {
                    const channels = automod.ignoredChannels
                        .map(id => interaction.guild.channels.cache.get(id))
                        .filter(channel => channel) // Filter out deleted channels
                        .map(channel => channel.name);

                    if (channels.length === 0) {
                        return interaction.reply({
                            content: translate('automod.no_ignored_channels', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    await interaction.reply({
                        content: translate('automod.ignored_channels_list', {
                            lng: userLang,
                            channels: channels.join('\n')
                        }),
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing ignored channels:', error);
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
