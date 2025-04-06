import { handleTicketButtons } from '../../components/buttons/ticketButtons.js';
import { handleTicTacToeButton } from '../../commands/games/tictactoe.js';
import { handleSnakeButton } from '../../commands/games/snake.js';
import { handleTriviaButton } from '../../commands/games/trivia.js';
import { handleEmbedModal, handleEmbedButton } from '../../commands/utility/embed.js';
import User from '../../models/User.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            // Get user's language preference
            const userPrefs = await User.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            const userLang = userPrefs?.language || 'en';

            // Handle slash commands
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction, userLang);
            }
            
            // Handle buttons
            else if (interaction.isButton()) {
                // Ticket system buttons
                if (['create_ticket', 'close_ticket', 'delete_ticket'].includes(interaction.customId)) {
                    await handleTicketButtons(interaction, userLang);
                }
                // TicTacToe buttons
                else if (interaction.customId.startsWith('ttt_')) {
                    await handleTicTacToeButton(interaction);
                }
                // Snake game buttons
                else if (interaction.customId.startsWith('snake_')) {
                    await handleSnakeButton(interaction);
                }
                // Trivia buttons
                else if (interaction.customId.startsWith('trivia_')) {
                    await handleTriviaButton(interaction);
                }
                // Embed builder buttons
                else if (interaction.customId.startsWith('embed_')) {
                    await handleEmbedButton(interaction);
                }
            }

            // Handle modals
            else if (interaction.isModalSubmit()) {
                if (interaction.customId === 'embed_creator') {
                    await handleEmbedModal(interaction);
                }
            }

            // Handle select menus
            else if (interaction.isStringSelectMenu()) {
                const menu = interaction.client.selectMenus.get(interaction.customId);
                if (!menu) return;

                await menu.execute(interaction, userLang);
            }
        } catch (error) {
            console.error(error);
            const reply = {
                content: 'There was an error executing this interaction!',
                ephemeral: true
            };
            
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }
};
