import { SlashCommandBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';

const FILTERS = {
    '3d': '3d',
    bassboost: 'bassboost',
    echo: 'echo',
    karaoke: 'karaoke',
    nightcore: 'nightcore',
    vaporwave: 'vaporwave',
    flanger: 'flanger',
    gate: 'gate',
    haas: 'haas',
    reverse: 'reverse',
    surround: 'surround',
    mcompand: 'mcompand',
    phaser: 'phaser',
    tremolo: 'tremolo',
    earwax: 'earwax'
};

export default {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply an audio filter to the music')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Filter type')
                .setRequired(true)
                .addChoices(
                    ...Object.entries(FILTERS).map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value
                    }))
                ))
        .addBooleanOption(option =>
            option
                .setName('clear')
                .setDescription('Clear all filters')),

    async execute(interaction, userLang) {
        const queue = interaction.client.distube.getQueue(interaction);
        if (!queue) {
            return interaction.reply({
                content: translate('music.not_playing', { lng: userLang }),
                ephemeral: true
            });
        }

        const clear = interaction.options.getBoolean('clear');
        if (clear) {
            queue.filters.clear();
            return interaction.reply({
                content: translate('music.filters_cleared', { lng: userLang }),
                ephemeral: true
            });
        }

        const filter = interaction.options.getString('type');
        try {
            await queue.filters.add(filter);
            await interaction.reply({
                content: `🎵 ${translate('music.filter_applied', { 
                    lng: userLang,
                    filter: filter
                })}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
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
