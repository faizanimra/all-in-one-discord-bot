// Example of creating a custom AutoMod rule
const { AutoModHandler } = require('../src/handlers/autoModHandler');

// Create a custom filter for detecting spam links
const spamLinkFilter = {
  name: 'spamLinks',
  description: 'Detects spam links in messages',

  // Define spam domains
  spamDomains: ['spam.com', 'scam.net'],

  // Define the filter logic
  execute: async (message) => {
    const urls = message.content.match(/https?:\/\/[^\s]+/g) || [];

    return urls.some((url) => this.spamDomains.some((domain) => url.includes(domain)));
  },

  // Define the action to take
  action: async (message) => {
    await message.delete();
    await message.channel.send(`${message.author}, spam links are not allowed!`);
    return true;
  },
};

// Register the custom filter
AutoModHandler.registerFilter(spamLinkFilter);

// Example usage in a command
module.exports = {
  name: 'customfilter',
  description: 'Add custom spam domains',
  permissions: ['ADMINISTRATOR'],

  execute: async (interaction) => {
    const domain = interaction.options.getString('domain');
    spamLinkFilter.spamDomains.push(domain);

    await interaction.reply({
      content: `Added ${domain} to spam filter`,
      ephemeral: true,
    });
  },
};
