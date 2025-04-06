import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import { createModLogEmbed } from '../../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('Timeout duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)) // 4 weeks
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the timeout')),

    async execute(interaction, userLang) {
        const target = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.reply({
                content: translate('common.invalid_user', { lng: userLang }),
                ephemeral: true
            });
        }

        // Check if bot can timeout the user
        if (!target.moderatable) {
            return interaction.reply({
                content: translate('admin.timeout.no_permission', { lng: userLang }),
                ephemeral: true
            });
        }

        try {
            await target.timeout(duration * 60 * 1000, reason);

            // Create mod log embed
            const logEmbed = createModLogEmbed({
                type: 'Timeout',
                user: target.user,
                moderator: interaction.user,
                reason,
                duration: `${duration} minutes`
            });

            // Send to mod logs if channel is set
            const modLogsChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (modLogsChannel) {
                await modLogsChannel.send({ embeds: [logEmbed] });
            }

            // Reply to interaction
            await interaction.reply({
                content: translate('admin.timeout.success', {
                    lng: userLang,
                    user: target.user.tag,
                    duration,
                    reason
                }),
                ephemeral: true
            });

            // DM the user
            try {
                await target.send(translate('admin.timeout.dm_message', {
                    lng: userLang,
                    guild: interaction.guild.name,
                    duration,
                    reason
                }));
            } catch (error) {
                console.log('Could not DM user about timeout');
            }
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
