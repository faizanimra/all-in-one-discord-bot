import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ You need to be in a voice channel!',
                ephemeral: true
            });
        }

        // Check bot permissions
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return interaction.reply({
                content: '❌ I need permissions to join and speak in your voice channel!',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply();
            await interaction.client.distube.play(voiceChannel, query, {
                member: interaction.member,
                textChannel: interaction.channel,
                metadata: { interaction }
            });
            
            // The actual reply will be handled by the DisTube events
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '❌ Error playing the song: ' + error.message,
                ephemeral: true
            });
        }
    }
};
