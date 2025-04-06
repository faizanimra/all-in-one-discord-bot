import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import AutoMod from '../../models/AutoMod.js';

export default {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure automod settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle automod features')
                .addStringOption(option =>
                    option.setName('feature')
                        .setDescription('The feature to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'All AutoMod', value: 'all' },
                            { name: 'Anti-Spam', value: 'antiSpam' },
                            { name: 'Anti-Link', value: 'antiLink' },
                            { name: 'Bad Words', value: 'badWords' },
                            { name: 'Mention Spam', value: 'mentionSpam' },
                            { name: 'Caps', value: 'caps' }
                        ))
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable the feature')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('Configure automod settings')
                .addStringOption(option =>
                    option.setName('feature')
                        .setDescription('The feature to configure')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Anti-Spam', value: 'antiSpam' },
                            { name: 'Anti-Link', value: 'antiLink' },
                            { name: 'Bad Words', value: 'badWords' },
                            { name: 'Mention Spam', value: 'mentionSpam' },
                            { name: 'Caps', value: 'caps' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ignore')
                .setDescription('Add/remove ignored channels or roles')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Add or remove')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' }
                        ))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Channel or role')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Channel', value: 'channel' },
                            { name: 'Role', value: 'role' }
                        ))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to ignore'))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to ignore')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('logchannel')
                .setDescription('Set the log channel for automod actions')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to log automod actions')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current automod settings')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let automod = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!automod) {
                automod = new AutoMod({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'toggle': {
                    const feature = interaction.options.getString('feature');
                    const enabled = interaction.options.getBoolean('enabled');

                    if (feature === 'all') {
                        automod.enabled = enabled;
                    } else {
                        automod.features[feature].enabled = enabled;
                    }

                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.toggle_success', {
                            lng: userLang,
                            feature: feature,
                            state: enabled ? 'enabled' : 'disabled'
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'config': {
                    const feature = interaction.options.getString('feature');
                    const settings = automod.features[feature];

                    const embed = new EmbedBuilder()
                        .setTitle(translate('automod.config_title', {
                            lng: userLang,
                            feature: feature
                        }))
                        .setDescription(translate('automod.config_description', { lng: userLang }))
                        .addFields(
                            Object.entries(settings).map(([key, value]) => ({
                                name: key,
                                value: Array.isArray(value) ? value.join(', ') || 'None' : value.toString(),
                                inline: true
                            }))
                        )
                        .setColor('#0099ff');

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
                }

                case 'ignore': {
                    const action = interaction.options.getString('action');
                    const type = interaction.options.getString('type');
                    const channel = interaction.options.getChannel('channel');
                    const role = interaction.options.getRole('role');

                    const target = type === 'channel' ? channel : role;
                    if (!target) {
                        return interaction.reply({
                            content: translate('automod.invalid_target', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    const list = type === 'channel' ? 'ignoredChannels' : 'ignoredRoles';

                    if (action === 'add') {
                        if (!automod[list].includes(target.id)) {
                            automod[list].push(target.id);
                        }
                    } else {
                        automod[list] = automod[list].filter(id => id !== target.id);
                    }

                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.ignore_success', {
                            lng: userLang,
                            action: action,
                            type: type,
                            target: target.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'logchannel': {
                    const channel = interaction.options.getChannel('channel');
                    automod.logChannel = channel.id;
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.log_channel_set', {
                            lng: userLang,
                            channel: channel.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'view': {
                    const embed = new EmbedBuilder()
                        .setTitle(translate('automod.settings_title', { lng: userLang }))
                        .setDescription(translate('automod.settings_description', { lng: userLang }))
                        .addFields(
                            {
                                name: translate('automod.status', { lng: userLang }),
                                value: automod.enabled ? '✅ Enabled' : '❌ Disabled',
                                inline: true
                            },
                            {
                                name: translate('automod.log_channel', { lng: userLang }),
                                value: automod.logChannel ? `<#${automod.logChannel}>` : 'Not set',
                                inline: true
                            }
                        )
                        .setColor('#0099ff');

                    // Add feature statuses
                    for (const [feature, settings] of Object.entries(automod.features)) {
                        embed.addFields({
                            name: feature,
                            value: `${settings.enabled ? '✅' : '❌'} ${Object.entries(settings)
                                .filter(([key]) => key !== 'enabled')
                                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.length : value}`)
                                .join('\n')}`,
                            inline: true
                        });
                    }

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing automod:', error);
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
