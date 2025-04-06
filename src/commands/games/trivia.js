import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const categories = {
    general: 9,
    books: 10,
    film: 11,
    music: 12,
    television: 14,
    videogames: 15,
    science: 17,
    computers: 18,
    mathematics: 19,
    sports: 21,
    geography: 22,
    history: 23,
    animals: 27
};

const difficulties = ['easy', 'medium', 'hard'];
const activeGames = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Play a trivia game')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Choose a category')
                .addChoices(
                    ...Object.keys(categories).map(cat => ({
                        name: cat.charAt(0).toUpperCase() + cat.slice(1),
                        value: cat
                    }))
                ))
        .addStringOption(option =>
            option
                .setName('difficulty')
                .setDescription('Choose difficulty')
                .addChoices(
                    ...difficulties.map(diff => ({
                        name: diff.charAt(0).toUpperCase() + diff.slice(1),
                        value: diff
                    }))
                )),

    async execute(interaction) {
        if (activeGames.has(interaction.user.id)) {
            return interaction.reply({
                content: "You're already playing a trivia game!",
                ephemeral: true
            });
        }

        const category = interaction.options.getString('category');
        const difficulty = interaction.options.getString('difficulty');

        try {
            // Fetch question from Open Trivia Database
            const params = new URLSearchParams({
                amount: 1,
                type: 'multiple',
                encode: 'base64'
            });

            if (category) params.append('category', categories[category]);
            if (difficulty) params.append('difficulty', difficulty);

            const response = await fetch(\`https://opentdb.com/api.php?\${params}\`);
            const data = await response.json();

            if (!data.results?.length) {
                return interaction.reply({
                    content: '❌ Failed to fetch trivia question. Please try again.',
                    ephemeral: true
                });
            }

            const question = data.results[0];
            
            // Decode base64 strings
            const decodedQuestion = Buffer.from(question.question, 'base64').toString();
            const decodedCorrect = Buffer.from(question.correct_answer, 'base64').toString();
            const decodedIncorrect = question.incorrect_answers.map(ans => 
                Buffer.from(ans, 'base64').toString()
            );

            // Shuffle answers
            const answers = [...decodedIncorrect, decodedCorrect]
                .sort(() => Math.random() - 0.5);

            const gameState = {
                question: decodedQuestion,
                correctAnswer: decodedCorrect,
                answers,
                category: Buffer.from(question.category, 'base64').toString(),
                difficulty: question.difficulty,
                timeout: null
            };

            activeGames.set(interaction.user.id, gameState);

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('🎯 Trivia Question')
                .setDescription(decodedQuestion)
                .addFields(
                    { name: 'Category', value: gameState.category, inline: true },
                    { name: 'Difficulty', value: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1), inline: true }
                )
                .setColor(0x00FF00)
                .setFooter({ text: 'You have 30 seconds to answer!' });

            // Create answer buttons
            const rows = [];
            for (let i = 0; i < answers.length; i += 2) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 2 && i + j < answers.length; j++) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(\`trivia_\${i + j}\`)
                            .setLabel(\`\${i + j + 1}. \${answers[i + j]}\`)
                            .setStyle(ButtonStyle.Primary)
                    );
                }
                rows.push(row);
            }

            await interaction.reply({
                embeds: [embed],
                components: rows
            });

            // Set timeout for question
            gameState.timeout = setTimeout(async () => {
                if (activeGames.has(interaction.user.id)) {
                    activeGames.delete(interaction.user.id);
                    await interaction.editReply({
                        content: \`⏰ Time's up! The correct answer was: **\${decodedCorrect}**\`,
                        components: [],
                        embeds: []
                    });
                }
            }, 30000);

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ There was an error starting the trivia game.',
                ephemeral: true
            });
        }
    }
};

export async function handleTriviaButton(interaction) {
    const gameState = activeGames.get(interaction.user.id);
    if (!gameState) {
        return interaction.reply({
            content: "You don't have an active trivia game!",
            ephemeral: true
        });
    }

    clearTimeout(gameState.timeout);
    activeGames.delete(interaction.user.id);

    const selectedIndex = parseInt(interaction.customId.split('_')[1]);
    const selectedAnswer = gameState.answers[selectedIndex];
    const correct = selectedAnswer === gameState.correctAnswer;

    const embed = new EmbedBuilder()
        .setTitle(correct ? '✅ Correct!' : '❌ Incorrect!')
        .setDescription(\`The correct answer was: **\${gameState.correctAnswer}**\`)
        .setColor(correct ? 0x00FF00 : 0xFF0000);

    await interaction.update({
        content: ' ',
        embeds: [embed],
        components: []
    });
}
