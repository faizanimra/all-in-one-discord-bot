import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';

const HANGMAN_STAGES = [
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```'
];

const CATEGORIES = {
    animals: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'KANGAROO', 'LION', 'TIGER', 'ZEBRA'],
    countries: ['FRANCE', 'JAPAN', 'BRAZIL', 'CANADA', 'AUSTRALIA', 'EGYPT', 'INDIA', 'MEXICO'],
    fruits: ['APPLE', 'BANANA', 'ORANGE', 'MANGO', 'PINEAPPLE', 'GRAPE', 'STRAWBERRY'],
    movies: ['AVATAR', 'INCEPTION', 'TITANIC', 'MATRIX', 'JAWS', 'FROZEN', 'GLADIATOR']
};

const games = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('hangman')
        .setDescription('Play Hangman')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Choose a word category')
                .setRequired(true)
                .addChoices(
                    ...Object.keys(CATEGORIES).map(cat => ({
                        name: cat.charAt(0).toUpperCase() + cat.slice(1),
                        value: cat
                    }))
                )),

    async execute(interaction, userLang) {
        if (games.has(interaction.user.id)) {
            return interaction.reply({
                content: translate('games.hangman.already_playing', { lng: userLang }),
                ephemeral: true
            });
        }

        const category = interaction.options.getString('category');
        const words = CATEGORIES[category];
        const word = words[Math.floor(Math.random() * words.length)];

        const game = {
            word,
            guessed: new Set(),
            mistakes: 0,
            status: 'playing'
        };

        games.set(interaction.user.id, game);

        const embed = createGameEmbed(game, category, userLang);
        const components = createKeyboard();

        await interaction.reply({
            embeds: [embed],
            components: components
        });

        // Set timeout to end game after 5 minutes
        setTimeout(() => {
            if (games.has(interaction.user.id)) {
                games.delete(interaction.user.id);
                try {
                    interaction.editReply({
                        content: translate('games.hangman.timeout', { lng: userLang }),
                        components: []
                    });
                } catch (error) {
                    console.error('Error ending Hangman game:', error);
                }
            }
        }, 5 * 60 * 1000);
    }
};

function createGameEmbed(game, category, userLang) {
    const hiddenWord = game.word
        .split('')
        .map(letter => game.guessed.has(letter) ? letter : '_')
        .join(' ');

    const guessedLetters = Array.from(game.guessed).sort().join(', ') || 'None';

    return new EmbedBuilder()
        .setTitle('Hangman')
        .setDescription(HANGMAN_STAGES[game.mistakes])
        .addFields(
            { name: translate('games.hangman.category', { lng: userLang }), value: category.charAt(0).toUpperCase() + category.slice(1) },
            { name: translate('games.hangman.word', { lng: userLang }), value: hiddenWord },
            { name: translate('games.hangman.guessed', { lng: userLang }), value: guessedLetters },
            { name: translate('games.hangman.mistakes', { lng: userLang }), value: \`\${game.mistakes}/6\` }
        )
        .setColor(game.mistakes < 6 ? '#0099ff' : '#ff0000');
}

function createKeyboard() {
    const rows = [];
    const letters = [
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
        ['O', 'P', 'Q', 'R', 'S', 'T'],
        ['U', 'V', 'W', 'X', 'Y', 'Z']
    ];

    letters.forEach(row => {
        const actionRow = new ActionRowBuilder();
        row.forEach(letter => {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(\`hangman_\${letter}\`)
                    .setLabel(letter)
                    .setStyle(ButtonStyle.Secondary)
            );
        });
        rows.push(actionRow);
    });

    return rows;
}

export async function handleHangmanButton(interaction) {
    const game = games.get(interaction.user.id);
    if (!game) {
        return interaction.reply({
            content: translate('games.hangman.no_game', { lng: userLang }),
            ephemeral: true
        });
    }

    const letter = interaction.customId.split('_')[1];
    
    if (game.guessed.has(letter)) {
        return interaction.reply({
            content: translate('games.hangman.already_guessed', { lng: userLang }),
            ephemeral: true
        });
    }

    game.guessed.add(letter);

    if (!game.word.includes(letter)) {
        game.mistakes++;
    }

    // Check if player won
    const won = game.word.split('').every(l => game.guessed.has(l));

    // Check if player lost
    const lost = game.mistakes >= 6;

    if (won || lost) {
        games.delete(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('Hangman - Game Over!')
            .setDescription(HANGMAN_STAGES[game.mistakes])
            .addFields(
                { name: 'Word', value: game.word },
                { name: 'Result', value: won ? '🎉 You won!' : '💀 You lost!' }
            )
            .setColor(won ? '#00ff00' : '#ff0000');

        return interaction.update({
            embeds: [embed],
            components: []
        });
    }

    // Update game state
    const embed = createGameEmbed(game, interaction.userLang);
    const components = createKeyboard();

    // Disable guessed letters
    components.forEach(row => {
        row.components.forEach(button => {
            if (game.guessed.has(button.data.label)) {
                button.setDisabled(true);
                button.setStyle(
                    game.word.includes(button.data.label) 
                        ? ButtonStyle.Success 
                        : ButtonStyle.Danger
                );
            }
        });
    });

    await interaction.update({
        embeds: [embed],
        components: components
    });
}
