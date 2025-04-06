import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import AutoMod from '../../models/AutoMod.js';

export default {
    data: new SlashCommandBuilder()
        .setName('badwords')
        .setDescription('Manage bad words filter')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a word to the filter')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('The word to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a word from the filter')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('The word to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all filtered words')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let automod = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!automod) {
                automod = new AutoMod({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'add': {
                    const word = interaction.options.getString('word').toLowerCase();

                    if (automod.features.badWords.words.includes(word)) {
                        return interaction.reply({
                            content: translate('automod.word_already_exists', {
                                lng: userLang,
                                word: word
                            }),
                            ephemeral: true
                        });
                    }

                    automod.features.badWords.words.push(word);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.word_added', {
                            lng: userLang,
                            word: word
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    const word = interaction.options.getString('word').toLowerCase();

                    if (!automod.features.badWords.words.includes(word)) {
                        return interaction.reply({
                            content: translate('automod.word_not_found', {
                                lng: userLang,
                                word: word
                            }),
                            ephemeral: true
                        });
                    }

                    automod.features.badWords.words = automod.features.badWords.words
                        .filter(w => w !== word);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.word_removed', {
                            lng: userLang,
                            word: word
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'list': {
                    const words = automod.features.badWords.words;
                    if (words.length === 0) {
                        return interaction.reply({
                            content: translate('automod.no_words', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    await interaction.reply({
                        content: translate('automod.word_list', {
                            lng: userLang,
                            words: words.join(', ')
                        }),
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing bad words:', error);
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
