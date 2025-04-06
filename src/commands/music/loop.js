import { SlashCommandBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';

const REPEAT_MODES = {
    0: 'OFF',
    1: 'SONG',
    2: 'QUEUE'
};

export default {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Change the loop mode')
        .addStringOption(option =>
            option
                .setName('mode')
                .setDescription('Loop mode')
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: '0' },
                    { name: 'Song', value: '1' },
                    { name: 'Queue', value: '2' }
                )),

    async execute(interaction, userLang) {
        const queue = interaction.client.distube.getQueue(interaction);
        if (!queue) {
            return interaction.reply({
                content: translate('music.not_playing', { lng: userLang }),
                ephemeral: true
            });
        }

        const mode = parseInt(interaction.options.getString('mode'));
        try {
            queue.setRepeatMode(mode);
            await interaction.reply({
                content: `🔁 ${translate('music.loop_mode', { 
                    lng: userLang,
                    mode: REPEAT_MODES[mode]
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
