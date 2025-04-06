import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        
        if (!queue) {
            return interaction.reply({
                content: '❌ There is nothing playing!',
                ephemeral: true
            });
        }

        try {
            if (queue.songs.length <= 1) {
                await queue.stop();
                await interaction.reply('⏭️ Skipped! No more songs in queue.');
            } else {
                const skippedSong = queue.songs[0];
                await queue.skip();
                await interaction.reply(`⏭️ Skipped: **${skippedSong.name}**`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Error skipping the song: ' + error.message,
                ephemeral: true
            });
        }
    }
};
