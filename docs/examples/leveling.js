// Example of customizing the leveling system
const { XPHandler } = require('../src/handlers/xpHandler');
const { User } = require('../src/models/User');
const { createCanvas, loadImage } = require('canvas');

// Custom XP calculation
const calculateXP = (level) => {
  return 5 * Math.pow(level, 2) + 50 * level + 100;
};

// Generate rank card using canvas
const generateRankCard = async (member, level) => {
  const canvas = createCanvas(700, 250);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = '#2f3136';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw user avatar
  const avatar = await loadImage(member.user.displayAvatarURL({ format: 'png' }));
  ctx.drawImage(avatar, 25, 25, 200, 200);

  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.font = '40px sans-serif';
  ctx.fillText(`Level ${level}`, 250, 125);

  return canvas.toBuffer();
};

// Custom level up message
const levelUpMessage = async (member, newLevel) => {
  // Get user's rank card
  const rankCard = await generateRankCard(member, newLevel);

  // Send level up message with rank card
  const channel = member.guild.channels.cache.get('LEVEL_UP_CHANNEL_ID');
  await channel.send({
    content: `🎉 Congratulations ${member}! You've reached level ${newLevel}!`,
    files: [rankCard],
  });
};

// Example of a custom reward system
const checkRewards = async (member, level) => {
  const rewards = {
    5: 'Beginner',
    10: 'Regular',
    20: 'Active Member',
    30: 'Super Active',
    50: 'Elite',
  };

  if (rewards[level]) {
    const role = member.guild.roles.cache.find((r) => r.name === rewards[level]);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      return `You've earned the ${rewards[level]} role!`;
    }
  }
  return null;
};

// Example usage in a command
module.exports = {
  name: 'givexp',
  description: 'Give XP to a user',
  permissions: ['ADMINISTRATOR'],

  execute: async (interaction) => {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    // Add XP and check for level up
    const user = await User.findOne({ userId: target.id });
    const oldLevel = user.level;

    await XPHandler.addXP(target.id, amount);
    const newLevel = Math.floor(0.1 * Math.sqrt(user.xp));

    if (newLevel > oldLevel) {
      await levelUpMessage(target, newLevel);
      const reward = await checkRewards(target, newLevel);
      if (reward) {
        await interaction.channel.send(reward);
      }
    }

    await interaction.reply({
      content: `Added ${amount} XP to ${target.tag}`,
      ephemeral: true,
    });
  },
};
