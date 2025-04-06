import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Change the music volume')
        .addIntegerOption(option =>
            option
                .setName('percentage')
                .setDescription('Volume percentage (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        
        if (!queue) {
            return interaction.reply({
                content: '❌ There is nothing playing!',
                ephemeral: true
            });
        }

        const volume = interaction.options.getInteger('percentage');

        try {
            queue.setVolume(volume);
            await interaction.reply(`🔊 Volume set to ${volume}%`);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Error changing volume: ' + error.message,
                ephemeral: true
            });
        }
    }
};
