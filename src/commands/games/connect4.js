import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';

const EMPTY = '⚪';
const PLAYER1 = '🔴';
const PLAYER2 = '🔵';
const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 6;

const games = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('connect4')
        .setDescription('Play Connect Four with another user')
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('The user to play against')
                .setRequired(true)),

    async execute(interaction, userLang) {
        const opponent = interaction.options.getUser('opponent');

        // Validation checks
        if (opponent.bot) {
            return interaction.reply({
                content: translate('games.connect4.not_against_bot', { lng: userLang }),
                ephemeral: true
            });
        }

        if (opponent.id === interaction.user.id) {
            return interaction.reply({
                content: translate('games.connect4.not_against_self', { lng: userLang }),
                ephemeral: true
            });
        }

        if (games.has(interaction.user.id) || games.has(opponent.id)) {
            return interaction.reply({
                content: translate('games.connect4.already_playing', { lng: userLang }),
                ephemeral: true
            });
        }

        // Initialize game state
        const game = {
            board: Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY)),
            players: [interaction.user.id, opponent.id],
            currentPlayer: 0,
            messageId: null
        };

        games.set(interaction.user.id, game);
        games.set(opponent.id, game);

        // Create game board message
        const embed = createGameEmbed(game, interaction.user, opponent);
        const components = createGameControls();

        const reply = await interaction.reply({
            content: `${interaction.user} vs ${opponent}`,
            embeds: [embed],
            components,
            fetchReply: true
        });

        game.messageId = reply.id;

        // Set timeout to end game after 5 minutes
        setTimeout(() => {
            if (games.has(interaction.user.id)) {
                games.delete(interaction.user.id);
                games.delete(opponent.id);
                try {
                    interaction.editReply({
                        content: translate('games.connect4.timeout', { lng: userLang }),
                        components: [],
                        embeds: [embed]
                    });
                } catch (error) {
                    console.error('Error ending Connect4 game:', error);
                }
            }
        }, 5 * 60 * 1000);
    }
};

function createGameEmbed(game, player1, player2) {
    return new EmbedBuilder()
        .setTitle('Connect Four')
        .setDescription(game.board.map(row => row.join('')).join('\n'))
        .addFields(
            { name: 'Player 1', value: `${player1} ${PLAYER1}`, inline: true },
            { name: 'Player 2', value: `${player2} ${PLAYER2}`, inline: true },
            { name: 'Current Turn', value: game.players[game.currentPlayer] === player1.id ? PLAYER1 : PLAYER2 }
        )
        .setColor('#0099ff');
}

function createGameControls() {
    const row = new ActionRowBuilder();
    for (let i = 0; i < BOARD_WIDTH; i++) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`connect4_${i}`)
                .setLabel(`${i + 1}`)
                .setStyle(ButtonStyle.Primary)
        );
    }
    return [row];
}

export async function handleConnect4Button(interaction) {
    const game = games.get(interaction.user.id);
    if (!game || game.messageId !== interaction.message.id) {
        return interaction.reply({
            content: translate('games.connect4.not_in_game', { lng: interaction.locale }),
            ephemeral: true
        });
    }

    if (game.players[game.currentPlayer] !== interaction.user.id) {
        return interaction.reply({
            content: translate('games.connect4.not_your_turn', { lng: interaction.locale }),
            ephemeral: true
        });
    }

    const column = parseInt(interaction.customId.split('_')[1]);
    
    // Find the lowest empty spot in the column
    let row = -1;
    for (let i = BOARD_HEIGHT - 1; i >= 0; i--) {
        if (game.board[i][column] === EMPTY) {
            row = i;
            break;
        }
    }

    if (row === -1) {
        return interaction.reply({
            content: translate('games.connect4.column_full', { lng: interaction.locale }),
            ephemeral: true
        });
    }

    // Place the piece
    game.board[row][column] = game.currentPlayer === 0 ? PLAYER1 : PLAYER2;

    // Check for win
    if (checkWin(game.board, row, column)) {
        const winner = interaction.user;
        games.delete(game.players[0]);
        games.delete(game.players[1]);

        const embed = new EmbedBuilder()
            .setTitle('Connect Four - Game Over!')
            .setDescription(game.board.map(row => row.join('')).join('\n'))
            .addFields(
                { name: 'Winner', value: `${winner} ${game.currentPlayer === 0 ? PLAYER1 : PLAYER2}` }
            )
            .setColor('#00ff00');

        return interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Check for draw
    if (game.board[0].every(cell => cell !== EMPTY)) {
        games.delete(game.players[0]);
        games.delete(game.players[1]);

        const embed = new EmbedBuilder()
            .setTitle('Connect Four - Draw!')
            .setDescription(game.board.map(row => row.join('')).join('\n'))
            .setColor('#ffff00');

        return interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Switch turns
    game.currentPlayer = 1 - game.currentPlayer;

    // Update the game board
    const opponent = await interaction.client.users.fetch(game.players[game.currentPlayer]);
    const embed = createGameEmbed(game, interaction.user, opponent);

    await interaction.update({
        embeds: [embed],
        components: createGameControls()
    });
}

function checkWin(board, row, col) {
    const piece = board[row][col];
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];

    return directions.some(([dy, dx]) => {
        let count = 1;
        // Check forward
        for (let i = 1; i < 4; i++) {
            const newRow = row + dy * i;
            const newCol = col + dx * i;
            if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== piece) break;
            count++;
        }
        // Check backward
        for (let i = 1; i < 4; i++) {
            const newRow = row - dy * i;
            const newCol = col - dx * i;
            if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== piece) break;
            count++;
        }
        return count >= 4;
    });
}

function isValidPosition(row, col) {
    return row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH;
}
