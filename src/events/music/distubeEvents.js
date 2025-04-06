import { EmbedBuilder } from 'discord.js';

export default {
    name: 'ready',
    once: true,
    execute(client) {
        const status = queue =>
            `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Loop: \`${
                queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'Off'
            }\``;

        client.distube
            .on('playSong', async (queue, song) => {
                const embed = new EmbedBuilder()
                    .setTitle('🎵 Now Playing')
                    .setDescription(`**${song.name}**`)
                    .addFields(
                        { name: 'Duration', value: `\`${song.formattedDuration}\``, inline: true },
                        { name: 'Requested by', value: `${song.user}`, inline: true },
                        { name: 'Status', value: status(queue) }
                    )
                    .setThumbnail(song.thumbnail)
                    .setColor(0x00FF00);

                queue.textChannel.send({ embeds: [embed] });
            })
            .on('addSong', async (queue, song) => {
                const embed = new EmbedBuilder()
                    .setTitle('🎵 Added to Queue')
                    .setDescription(`**${song.name}**`)
                    .addFields(
                        { name: 'Duration', value: `\`${song.formattedDuration}\``, inline: true },
                        { name: 'Requested by', value: `${song.user}`, inline: true },
                        { name: 'Position', value: `${queue.songs.length}`, inline: true }
                    )
                    .setThumbnail(song.thumbnail)
                    .setColor(0x00FF00);

                if (song.metadata?.interaction) {
                    await song.metadata.interaction.editReply({ embeds: [embed] });
                } else {
                    queue.textChannel.send({ embeds: [embed] });
                }
            })
            .on('addList', (queue, playlist) => {
                const embed = new EmbedBuilder()
                    .setTitle('📑 Added Playlist to Queue')
                    .setDescription(`**${playlist.name}**`)
                    .addFields(
                        { name: 'Duration', value: `\`${playlist.formattedDuration}\``, inline: true },
                        { name: 'Songs', value: `${playlist.songs.length}`, inline: true },
                        { name: 'Requested by', value: `${playlist.user}`, inline: true }
                    )
                    .setColor(0x00FF00);

                if (playlist.metadata?.interaction) {
                    playlist.metadata.interaction.editReply({ embeds: [embed] });
                } else {
                    queue.textChannel.send({ embeds: [embed] });
                }
            })
            .on('error', (channel, error) => {
                console.error(error);
                if (channel) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('❌ Error')
                                .setDescription(`An error occurred: ${error.message}`)
                                .setColor(0xFF0000)
                        ]
                    });
                }
            })
            .on('empty', channel => {
                channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('👋 Leaving Channel')
                            .setDescription('Voice channel is empty! Leaving the channel...')
                            .setColor(0xFFA500)
                    ]
                });
            })
            .on('finish', queue => {
                queue.textChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('✅ Queue Finished')
                            .setDescription('No more songs in queue!')
                            .setColor(0x00FF00)
                    ]
                });
            });
    }
};
