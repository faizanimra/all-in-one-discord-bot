import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translate } from '../../utils/i18n.js';

export default {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages with advanced filters')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Only delete messages from this user'))
        .addStringOption(option =>
            option
                .setName('contains')
                .setDescription('Only delete messages containing this text'))
        .addBooleanOption(option =>
            option
                .setName('bots')
                .setDescription('Only delete messages from bots'))
        .addBooleanOption(option =>
            option
                .setName('attachments')
                .setDescription('Only delete messages with attachments')),

    async execute(interaction, userLang) {
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');
        const contains = interaction.options.getString('contains')?.toLowerCase();
        const bots = interaction.options.getBoolean('bots');
        const attachments = interaction.options.getBoolean('attachments');

        await interaction.deferReply({ ephemeral: true });

        try {
            let messages = await interaction.channel.messages.fetch({
                limit: amount
            });

            // Apply filters
            let filtered = messages.filter(msg => {
                if (user && msg.author.id !== user.id) return false;
                if (contains && !msg.content.toLowerCase().includes(contains)) return false;
                if (bots && !msg.author.bot) return false;
                if (attachments && msg.attachments.size === 0) return false;
                return true;
            });

            const deletedCount = filtered.size;
            await interaction.channel.bulkDelete(filtered, true);

            await interaction.editReply({
                content: translate('admin.purge.success', {
                    lng: userLang,
                    count: deletedCount
                }),
                ephemeral: true
            });

            // Log the purge
            const modLogsChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (modLogsChannel) {
                const logMessage = {
                    content: translate('admin.purge.log', {
                        lng: userLang,
                        moderator: interaction.user.tag,
                        count: deletedCount,
                        channel: interaction.channel.name,
                        filters: [
                            user ? `User: ${user.tag}` : null,
                            contains ? `Contains: ${contains}` : null,
                            bots ? 'Bots only' : null,
                            attachments ? 'With attachments' : null
                        ].filter(Boolean).join(', ') || 'None'
                    })
                };
                await modLogsChannel.send(logMessage);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: translate('common.error', {
                    lng: userLang,
                    error: error.message
                }),
                ephemeral: true
            });
        }
    }
};
