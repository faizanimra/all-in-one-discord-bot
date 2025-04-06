import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const gameStates = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play Tic Tac Toe')
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('The user to play against')
                .setRequired(true)),

    async execute(interaction) {
        const opponent = interaction.options.getUser('opponent');

        if (opponent.bot) {
            return interaction.reply({
                content: "You can't play against a bot!",
                ephemeral: true
            });
        }

        if (opponent.id === interaction.user.id) {
            return interaction.reply({
                content: "You can't play against yourself!",
                ephemeral: true
            });
        }

        // Create game state
        const gameState = {
            players: [interaction.user.id, opponent.id],
            currentPlayer: 0,
            board: Array(9).fill(null),
            message: null
        };

        gameStates.set(interaction.channelId, gameState);

        // Create the game board
        const rows = createBoard(gameState);

        await interaction.reply({
            content: `🎮 Tic Tac Toe: ${interaction.user} (X) vs ${opponent} (O)\nIt's ${interaction.user}'s turn!`,
            components: rows
        });

        gameState.message = await interaction.fetchReply();
    }
};

function createBoard(gameState) {
    const rows = [];
    for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const index = i * 3 + j;
            const button = new ButtonBuilder()
                .setCustomId(`ttt_${index}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel(gameState.board[index] || ' ');

            if (gameState.board[index]) {
                button.setDisabled(true);
            }

            row.addComponents(button);
        }
        rows.push(row);
    }
    return rows;
}

// Add this to your button interaction handler
export async function handleTicTacToeButton(interaction) {
    const gameState = gameStates.get(interaction.channelId);
    if (!gameState || !gameState.message) return;

    const position = parseInt(interaction.customId.split('_')[1]);
    const player = gameState.players[gameState.currentPlayer];

    if (interaction.user.id !== player) {
        return interaction.reply({
            content: "It's not your turn!",
            ephemeral: true
        });
    }

    if (gameState.board[position] !== null) {
        return interaction.reply({
            content: "That position is already taken!",
            ephemeral: true
        });
    }

    // Update the board
    gameState.board[position] = gameState.currentPlayer === 0 ? 'X' : 'O';
    gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;

    // Check for winner
    const winner = checkWinner(gameState.board);
    const isDraw = !gameState.board.includes(null);

    // Update the message
    let content;
    if (winner) {
        const winnerUser = await interaction.client.users.fetch(gameState.players[winner === 'X' ? 0 : 1]);
        content = `🎮 Game Over! ${winnerUser} (${winner}) wins! 🎉`;
        gameStates.delete(interaction.channelId);
    } else if (isDraw) {
        content = "🎮 Game Over! It's a draw! 🤝";
        gameStates.delete(interaction.channelId);
    } else {
        const nextPlayer = await interaction.client.users.fetch(gameState.players[gameState.currentPlayer]);
        content = `🎮 Tic Tac Toe: ${interaction.user} (X) vs ${interaction.message.mentions.users.last()} (O)\nIt's ${nextPlayer}'s turn!`;
    }

    await interaction.update({
        content: content,
        components: createBoard(gameState)
    });
}

function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return null;
}
