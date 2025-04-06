// Example of using the music system
const { MusicHandler } = require('../src/handlers/musicHandler');

// Create a progress bar for the current song
const createProgressBar = (queue) => {
  const progress = queue.currentTime / queue.songs[0].duration;
  const size = 20;
  const line = '▬';
  const slider = '🔘';

  const bar = line.repeat(size).split('');
  const position = Math.round(size * progress);
  bar[position] = slider;

  return `${bar.join('')} ${queue.formattedCurrentTime}/${queue.songs[0].formattedDuration}`;
};

// Custom music queue display
const displayQueue = (queue) => {
  const songs = queue.songs
    .map((song, i) => {
      return `${i === 0 ? 'Playing:' : `${i}.`} ${song.name} - \`${song.formattedDuration}\``;
    })
    .slice(0, 10);

  return {
    embeds: [
      {
        title: '🎵 Music Queue',
        description: songs.join('\n'),
        fields: [
          {
            name: 'Now Playing',
            value: `${queue.songs[0].name}\n${createProgressBar(queue)}`,
          },
          {
            name: 'Settings',
            value: `Volume: ${queue.volume}%\nLoop: ${queue.repeatMode ? 'On' : 'Off'}`,
          },
        ],
      },
    ],
  };
};

// Example of a custom music filter
const customFilter = {
  name: 'customBass',
  filter: {
    aresample: '48000',
    asetrate: '48000*0.9',
    bass: 'g=10,f=110,w=0.3',
  },
};

// Example usage in a command
module.exports = {
  name: 'play',
  description: 'Play a song',

  execute: async (interaction) => {
    const query = interaction.options.getString('song');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply('You need to be in a voice channel!');
    }

    try {
      await MusicHandler.play(voiceChannel, query);
      const queue = MusicHandler.getQueue(interaction.guild);

      await interaction.reply(displayQueue(queue));
    } catch (error) {
      await interaction.reply({
        content: `Error: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
