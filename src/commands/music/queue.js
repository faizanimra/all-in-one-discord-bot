import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the music queue')
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('Page number')
                .setMinValue(1)),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        
        if (!queue) {
            return interaction.reply({
                content: '❌ There is nothing playing!',
                ephemeral: true
            });
        }

        try {
            const songsPerPage = 10;
            const totalPages = Math.ceil(queue.songs.length / songsPerPage);
            const page = (interaction.options.getInteger('page') || 1) - 1;

            if (page >= totalPages) {
                return interaction.reply({
                    content: `❌ Invalid page. Total pages: ${totalPages}`,
                    ephemeral: true
                });
            }

            const currentSong = queue.songs[0];
            const remainingSongs = queue.songs.slice(1);
            const startIndex = page * songsPerPage;
            const endIndex = startIndex + songsPerPage;
            const pageItems = remainingSongs.slice(startIndex, endIndex);

            const embed = new EmbedBuilder()
                .setTitle('🎵 Music Queue')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Now Playing', value: `**${currentSong.name}** - \`${currentSong.formattedDuration}\`` },
                    { name: 'Up Next', value: pageItems.length ? pageItems.map((song, i) => 
                        `${startIndex + i + 1}. **${song.name}** - \`${song.formattedDuration}\``
                    ).join('\n') : 'No more songs in queue' }
                )
                .setFooter({ text: `Page ${page + 1}/${totalPages} • ${queue.songs.length - 1} songs in queue` });

            if (queue.songs.length > 1) {
                const totalDuration = queue.songs.reduce((acc, song) => acc + song.duration, 0);
                const hours = Math.floor(totalDuration / 3600);
                const minutes = Math.floor((totalDuration % 3600) / 60);
                embed.addFields({
                    name: 'Queue Duration',
                    value: `${hours}h ${minutes}m`
                });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Error displaying queue: ' + error.message,
                ephemeral: true
            });
        }
    }
};
