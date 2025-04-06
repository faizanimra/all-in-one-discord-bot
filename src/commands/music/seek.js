import { SlashCommandBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';

export default {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seek to a specific position in the current song')
        .addIntegerOption(option =>
            option
                .setName('time')
                .setDescription('Time in seconds to seek to')
                .setRequired(true)),

    async execute(interaction, userLang) {
        const queue = interaction.client.distube.getQueue(interaction);
        if (!queue) {
            return interaction.reply({
                content: translate('music.not_playing', { lng: userLang }),
                ephemeral: true
            });
        }

        const time = interaction.options.getInteger('time');
        try {
            await queue.seek(time * 1000); // Convert to milliseconds
            await interaction.reply({
                content: `⏩ ${translate('music.seeked', { 
                    lng: userLang,
                    time: time
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
