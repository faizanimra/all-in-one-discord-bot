import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import AutoMod from '../../models/AutoMod.js';

export default {
    data: new SlashCommandBuilder()
        .setName('punishments')
        .setDescription('Configure automod punishments')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set punishment for a feature')
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
                        ))
                .addStringOption(option =>
                    option.setName('punishment')
                        .setDescription('The punishment to apply')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Delete Message', value: 'delete' },
                            { name: 'Timeout User', value: 'mute' },
                            { name: 'Kick User', value: 'kick' },
                            { name: 'Ban User', value: 'ban' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('duration')
                .setDescription('Set timeout duration for mute punishment')
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
                        ))
                .addIntegerOption(option =>
                    option.setName('minutes')
                        .setDescription('Timeout duration in minutes')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(60)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current punishment settings')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let automod = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!automod) {
                automod = new AutoMod({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'set': {
                    const feature = interaction.options.getString('feature');
                    const punishment = interaction.options.getString('punishment');

                    automod.features[feature].punishment = punishment;
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.punishment_set', {
                            lng: userLang,
                            feature: feature,
                            punishment: punishment
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'duration': {
                    const feature = interaction.options.getString('feature');
                    const minutes = interaction.options.getInteger('minutes');

                    if (automod.features[feature].punishment !== 'mute') {
                        return interaction.reply({
                            content: translate('automod.not_mute_punishment', {
                                lng: userLang,
                                feature: feature
                            }),
                            ephemeral: true
                        });
                    }

                    automod.features[feature].muteDuration = minutes;
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.duration_set', {
                            lng: userLang,
                            feature: feature,
                            duration: minutes
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'view': {
                    const features = Object.entries(automod.features)
                        .map(([feature, settings]) => {
                            const duration = settings.punishment === 'mute' 
                                ? ` (${settings.muteDuration} minutes)` 
                                : '';
                            return `${feature}: ${settings.punishment}${duration}`;
                        })
                        .join('\n');

                    await interaction.reply({
                        content: translate('automod.punishment_list', {
                            lng: userLang,
                            settings: features
                        }),
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing punishments:', error);
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
