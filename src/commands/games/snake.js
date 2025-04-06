import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const BOARD_SIZE = 10;
const EMPTY = '⬛';
const SNAKE = '🟩';
const FOOD = '🍎';

const games = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('snake')
        .setDescription('Play Snake game'),

    async execute(interaction) {
        if (games.has(interaction.user.id)) {
            return interaction.reply({
                content: "You're already playing a game!",
                ephemeral: true
            });
        }

        // Initialize game state
        const game = {
            board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY)),
            snake: [{x: 5, y: 5}],
            direction: 'RIGHT',
            food: null,
            score: 0,
            gameOver: false
        };

        // Place initial food
        placeFood(game);

        // Update board with snake and food
        updateBoard(game);

        // Create controls
        const controls = createControls();

        // Store game state
        games.set(interaction.user.id, game);

        await interaction.reply({
            content: `🐍 Snake Game | Score: ${game.score}\n${renderBoard(game)}`,
            components: controls
        });

        // Set up game loop
        game.interval = setInterval(() => {
            if (game.gameOver) {
                clearInterval(game.interval);
                return;
            }
            moveSnake(game);
            if (game.gameOver) {
                clearInterval(game.interval);
                interaction.editReply({
                    content: `🐍 Game Over! Final Score: ${game.score}\n${renderBoard(game)}`,
                    components: []
                });
                games.delete(interaction.user.id);
            } else {
                interaction.editReply({
                    content: `🐍 Snake Game | Score: ${game.score}\n${renderBoard(game)}`,
                    components: controls
                });
            }
        }, 2000); // Move every 2 seconds
    }
};

function createControls() {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('snake_up')
                .setEmoji('⬆️')
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('snake_left')
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('snake_stop')
                .setEmoji('⏹️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('snake_right')
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Primary)
        );

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('snake_down')
                .setEmoji('⬇️')
                .setStyle(ButtonStyle.Primary)
        );

    return [row1, row2, row3];
}

function placeFood(game) {
    let x, y;
    do {
        x = Math.floor(Math.random() * BOARD_SIZE);
        y = Math.floor(Math.random() * BOARD_SIZE);
    } while (game.snake.some(segment => segment.x === x && segment.y === y));
    
    game.food = { x, y };
}

function updateBoard(game) {
    // Clear board
    game.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // Place food
    game.board[game.food.y][game.food.x] = FOOD;
    
    // Place snake
    game.snake.forEach(segment => {
        game.board[segment.y][segment.x] = SNAKE;
    });
}

function renderBoard(game) {
    return game.board.map(row => row.join('')).join('\n');
}

function moveSnake(game) {
    const head = { ...game.snake[0] };

    // Move head
    switch (game.direction) {
        case 'UP':
            head.y--;
            break;
        case 'DOWN':
            head.y++;
            break;
        case 'LEFT':
            head.x--;
            break;
        case 'RIGHT':
            head.x++;
            break;
    }

    // Check collision with walls
    if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        game.gameOver = true;
        return;
    }

    // Check collision with self
    if (game.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        game.gameOver = true;
        return;
    }

    // Move snake
    game.snake.unshift(head);

    // Check if food eaten
    if (head.x === game.food.x && head.y === game.food.y) {
        game.score += 10;
        placeFood(game);
    } else {
        game.snake.pop();
    }

    updateBoard(game);
}

export async function handleSnakeButton(interaction) {
    const game = games.get(interaction.user.id);
    if (!game) {
        return interaction.reply({
            content: "You don't have an active game!",
            ephemeral: true
        });
    }

    if (interaction.customId === 'snake_stop') {
        clearInterval(game.interval);
        game.gameOver = true;
        games.delete(interaction.user.id);
        return interaction.update({
            content: `🐍 Game Over! Final Score: ${game.score}\n${renderBoard(game)}`,
            components: []
        });
    }

    const direction = interaction.customId.split('_')[1].toUpperCase();
    const opposites = {
        'UP': 'DOWN',
        'DOWN': 'UP',
        'LEFT': 'RIGHT',
        'RIGHT': 'LEFT'
    };

    // Prevent moving in opposite direction
    if (direction !== opposites[game.direction]) {
        game.direction = direction;
    }

    await interaction.deferUpdate();
}
