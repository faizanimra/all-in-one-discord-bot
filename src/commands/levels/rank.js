import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import User from '../../models/User.js';

export default {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your or another user\'s rank')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to check rank for')),

    async execute(interaction, userLang) {
        const target = interaction.options.getUser('user') || interaction.user;
        
        try {
            const user = await User.findOne({
                userId: target.id,
                guildId: interaction.guild.id
            });

            if (!user) {
                return interaction.reply({
                    content: translate('levels.no_data', { 
                        lng: userLang,
                        user: target.tag 
                    }),
                    ephemeral: true
                });
            }

            // Get user's rank
            const rank = await User.countDocuments({
                guildId: interaction.guild.id,
                xp: { $gt: user.xp }
            }) + 1;

            // Calculate progress to next level
            const currentLevelXP = user.xpForNextLevel();
            const progress = (user.xp / currentLevelXP) * 100;
            const progressBar = createProgressBar(progress);

            const embed = new EmbedBuilder()
                .setTitle(`${target.tag}'s Rank`)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: translate('levels.rank', { lng: userLang }), value: `#${rank}`, inline: true },
                    { name: translate('levels.level', { lng: userLang }), value: `${user.level}`, inline: true },
                    { name: translate('levels.xp', { lng: userLang }), value: `${user.xp}/${currentLevelXP}`, inline: true },
                    { name: translate('levels.progress', { lng: userLang }), value: progressBar },
                    { name: translate('levels.messages', { lng: userLang }), value: `${user.messageCount}`, inline: true },
                    { name: translate('levels.voice_time', { lng: userLang }), value: `${formatVoiceTime(user.totalVoiceTime)}`, inline: true }
                )
                .setColor('#0099ff')
                .setFooter({ text: translate('levels.footer', { lng: userLang }) });

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

function createProgressBar(percent) {
    const filled = '█';
    const empty = '░';
    const totalBars = 20;
    const filledBars = Math.round(percent / 100 * totalBars);
    return filled.repeat(filledBars) + empty.repeat(totalBars - filledBars);
}

function formatVoiceTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}
