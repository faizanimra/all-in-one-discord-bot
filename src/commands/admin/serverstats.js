import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import ServerStats from '../../models/ServerStats.js';

export default {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('View server statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription('View general server statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('View channel activity statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('View member activity statistics')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            const stats = await ServerStats.findOne({ guildId: interaction.guild.id });
            if (!stats) {
                return interaction.reply({
                    content: translate('stats.no_data', { lng: userLang }),
                    ephemeral: true
                });
            }

            switch (subcommand) {
                case 'overview': {
                    const embed = new EmbedBuilder()
                        .setTitle(translate('stats.overview_title', { lng: userLang }))
                        .addFields(
                            {
                                name: translate('stats.total_messages', { lng: userLang }),
                                value: stats.totalMessages.toString(),
                                inline: true
                            },
                            {
                                name: translate('stats.total_members', { lng: userLang }),
                                value: stats.totalMembers.toString(),
                                inline: true
                            },
                            {
                                name: translate('stats.active_members', { lng: userLang }),
                                value: stats.activeMembers.toString(),
                                inline: true
                            },
                            {
                                name: translate('stats.commands_used', { lng: userLang }),
                                value: stats.totalCommands.toString(),
                                inline: true
                            },
                            {
                                name: translate('stats.voice_time', { lng: userLang }),
                                value: formatMinutes(stats.totalVoiceMinutes),
                                inline: true
                            }
                        )
                        .setColor('#0099ff')
                        .setFooter({
                            text: translate('stats.last_updated', {
                                lng: userLang,
                                time: stats.lastUpdated.toLocaleString()
                            })
                        });

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'channels': {
                    const topChannels = await Promise.all(
                        stats.channelStats
                            .sort((a, b) => b.messageCount - a.messageCount)
                            .slice(0, 10)
                            .map(async (stat) => {
                                const channel = await interaction.guild.channels.fetch(stat.channelId);
                                return channel ? {
                                    name: channel.name,
                                    count: stat.messageCount,
                                    lastMessage: stat.lastMessage
                                } : null;
                            })
                    );

                    const embed = new EmbedBuilder()
                        .setTitle(translate('stats.channels_title', { lng: userLang }))
                        .setDescription(
                            topChannels
                                .filter(Boolean)
                                .map((ch, i) => 
                                    `${i + 1}. #${ch.name}: ${ch.count} messages\n` +
                                    `   ${translate('stats.last_active', { 
                                        lng: userLang,
                                        time: ch.lastMessage.toLocaleString()
                                    })}`
                                )
                                .join('\n\n')
                        )
                        .setColor('#0099ff');

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'members': {
                    const memberActivity = stats.memberActivity
                        .sort((a, b) => b.date - a.date)
                        .slice(0, 7);

                    const embed = new EmbedBuilder()
                        .setTitle(translate('stats.members_title', { lng: userLang }))
                        .setDescription(
                            memberActivity
                                .map(day => 
                                    `${day.date.toLocaleDateString()}\n` +
                                    `${translate('stats.joins', { lng: userLang })}: ${day.joins}\n` +
                                    `${translate('stats.leaves', { lng: userLang })}: ${day.leaves}\n` +
                                    `${translate('stats.net_change', { lng: userLang })}: ${day.joins - day.leaves}`
                                )
                                .join('\n\n')
                        )
                        .setColor('#0099ff');

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error('Error displaying server stats:', error);
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

function formatMinutes(minutes) {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    
    return parts.join(' ') || '0m';
}
