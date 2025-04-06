import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playing music and clear the queue'),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        
        if (!queue) {
            return interaction.reply({
                content: '❌ There is nothing playing!',
                ephemeral: true
            });
        }

        try {
            await queue.stop();
            await interaction.reply('🛑 Stopped the music and cleared the queue!');
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Error stopping the music: ' + error.message,
                ephemeral: true
            });
        }
    }
};
