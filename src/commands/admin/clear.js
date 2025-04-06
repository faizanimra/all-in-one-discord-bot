import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from the channel')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Only clear messages from this user'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const target = interaction.options.getUser('target');

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({
                limit: amount + 1 // +1 to include the command message
            });

            // Filter messages if target user specified
            const filteredMessages = target
                ? messages.filter(msg => msg.author.id === target.id)
                : messages;

            // Delete messages
            await interaction.channel.bulkDelete(filteredMessages, true);

            // Log the action
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '🧹 Messages Cleared',
                        fields: [
                            { name: 'Channel', value: `${interaction.channel}`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Amount', value: `${filteredMessages.size - 1}`, inline: true },
                            { name: 'Target User', value: target ? target.tag : 'None' }
                        ],
                        color: 0x00FF00,
                        timestamp: new Date()
                    }]
                });
            }

            // Send success message that deletes itself after 5 seconds
            return interaction.reply({
                content: `Successfully cleared ${filteredMessages.size - 1} messages${target ? ` from ${target.tag}` : ''}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            
            if (error.code === 50034) {
                return interaction.reply({
                    content: 'Cannot delete messages older than 14 days.',
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: 'There was an error while trying to clear messages.',
                ephemeral: true
            });
        }
    }
};
