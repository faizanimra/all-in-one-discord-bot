import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import User from '../../models/User.js';

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the server\'s XP leaderboard')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of leaderboard to view')
                .setRequired(true)
                .addChoices(
                    { name: 'XP', value: 'xp' },
                    { name: 'Voice Time', value: 'voice' },
                    { name: 'Messages', value: 'messages' }
                )),

    async execute(interaction, userLang) {
        const type = interaction.options.getString('type');
        
        try {
            let sortField;
            let title;
            let valueFormatter;

            switch (type) {
                case 'xp':
                    sortField = 'xp';
                    title = translate('levels.xp_leaderboard', { lng: userLang });
                    valueFormatter = (user) => `Level ${user.level} (${user.xp} XP)`;
                    break;
                case 'voice':
                    sortField = 'totalVoiceTime';
                    title = translate('levels.voice_leaderboard', { lng: userLang });
                    valueFormatter = (user) => formatVoiceTime(user.totalVoiceTime);
                    break;
                case 'messages':
                    sortField = 'messageCount';
                    title = translate('levels.message_leaderboard', { lng: userLang });
                    valueFormatter = (user) => `${user.messageCount} messages`;
                    break;
            }

            // Get top 10 users
            const users = await User.find({ guildId: interaction.guild.id })
                .sort({ [sortField]: -1 })
                .limit(10);

            if (!users.length) {
                return interaction.reply({
                    content: translate('levels.no_data_guild', { lng: userLang }),
                    ephemeral: true
                });
            }

            // Create leaderboard embed
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor('#0099ff')
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ 
                    text: translate('levels.leaderboard_footer', { 
                        lng: userLang,
                        guild: interaction.guild.name 
                    })
                });

            // Add fields for each user
            let description = '';
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                if (member) {
                    const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : '▫️';
                    description += `${medal} **${i + 1}.** ${member.user.tag}: ${valueFormatter(user)}\n`;
                }
            }

            embed.setDescription(description);

            // Add user's rank if not in top 10
            const userRank = await User.countDocuments({
                guildId: interaction.guild.id,
                [sortField]: { $gt: (await User.findOne({
                    userId: interaction.user.id,
                    guildId: interaction.guild.id
                }))?.[sortField] || 0 }
            }) + 1;

            if (userRank > 10) {
                const userData = await User.findOne({
                    userId: interaction.user.id,
                    guildId: interaction.guild.id
                });

                if (userData) {
                    embed.addFields({
                        name: translate('levels.your_rank', { lng: userLang }),
                        value: `#${userRank} (${valueFormatter(userData)})`
                    });
                }
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
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

function formatVoiceTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}
