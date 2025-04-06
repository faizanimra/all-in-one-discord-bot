import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause or resume the current song'),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        
        if (!queue) {
            return interaction.reply({
                content: '❌ There is nothing playing!',
                ephemeral: true
            });
        }

        try {
            if (queue.paused) {
                queue.resume();
                await interaction.reply('▶️ Resumed the music!');
            } else {
                queue.pause();
                await interaction.reply('⏸️ Paused the music!');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Error toggling pause: ' + error.message,
                ephemeral: true
            });
        }
    }
};
