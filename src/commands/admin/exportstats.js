import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import ServerStats from '../../models/ServerStats.js';

export default {
    data: new SlashCommandBuilder()
        .setName('exportstats')
        .setDescription('Export server statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Export format')
                .setRequired(true)
                .addChoices(
                    { name: 'JSON', value: 'json' },
                    { name: 'CSV', value: 'csv' }
                )),

    async execute(interaction, userLang) {
        const format = interaction.options.getString('format');

        try {
            const stats = await ServerStats.findOne({ guildId: interaction.guild.id });
            if (!stats) {
                return interaction.reply({
                    content: translate('stats.no_data', { lng: userLang }),
                    ephemeral: true
                });
            }

            let fileContent;
            let fileName;

            if (format === 'json') {
                fileContent = JSON.stringify({
                    guildName: interaction.guild.name,
                    totalMessages: stats.totalMessages,
                    totalMembers: stats.totalMembers,
                    activeMembers: stats.activeMembers,
                    totalCommands: stats.totalCommands,
                    totalVoiceMinutes: stats.totalVoiceMinutes,
                    channelStats: stats.channelStats.map(ch => ({
                        channelName: interaction.guild.channels.cache.get(ch.channelId)?.name || 'deleted-channel',
                        messageCount: ch.messageCount,
                        lastMessage: ch.lastMessage
                    })),
                    memberActivity: stats.memberActivity
                }, null, 2);
                fileName = `${interaction.guild.name}-stats.json`;
            } else {
                // CSV format
                const headers = ['Date', 'Total Messages', 'Total Members', 'Active Members', 'Commands Used', 'Voice Minutes'];
                const rows = stats.memberActivity.map(day => [
                    day.date.toISOString().split('T')[0],
                    stats.totalMessages,
                    stats.totalMembers,
                    stats.activeMembers,
                    stats.totalCommands,
                    stats.totalVoiceMinutes
                ].join(','));

                fileContent = [headers.join(','), ...rows].join('\n');
                fileName = `${interaction.guild.name}-stats.csv`;
            }

            const file = new AttachmentBuilder(Buffer.from(fileContent, 'utf-8'), { name: fileName });

            await interaction.reply({
                content: translate('stats.export_success', { lng: userLang }),
                files: [file],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error exporting stats:', error);
            await interaction.reply({
                content: translate('common.error', {
                    lng: userLang,
                    error: error.message
                }),
                ephemeral: true
            });
        }
    }
};
