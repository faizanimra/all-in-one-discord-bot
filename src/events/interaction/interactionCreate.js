import { updateCommandStats } from '../../handlers/statsHandler.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        try {
            // Update command usage stats
            await updateCommandStats(interaction);

            // Get user's language preference
            const userLang = 'en'; // You can implement language detection here

            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            await command.execute(interaction, userLang);
        } catch (error) {
            console.error('Error executing command:', error);
            const errorMessage = {
                content: 'There was an error executing this command.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
