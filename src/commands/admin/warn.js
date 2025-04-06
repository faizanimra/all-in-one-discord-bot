import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import User from '../../models/User.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        try {
            // Add warning to database
            const user = await User.findOneAndUpdate(
                { userId: target.id, guildId: interaction.guild.id },
                {
                    $push: {
                        warnings: {
                            reason,
                            moderator: interaction.user.id,
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true, new: true }
            );

            // Get total warnings count
            const warningCount = user.warnings.length;

            // Send DM to warned user
            try {
                await target.send({
                    embeds: [{
                        title: '⚠️ Warning Received',
                        description: `You have been warned in ${interaction.guild.name}`,
                        fields: [
                            { name: 'Reason', value: reason },
                            { name: 'Warning Count', value: `${warningCount}` }
                        ],
                        color: 0xFFD700,
                        timestamp: new Date()
                    }]
                });
            } catch (error) {
                console.log(`Could not DM user ${target.tag}`);
            }

            // Log the warning
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '⚠️ User Warned',
                        fields: [
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Reason', value: reason },
                            { name: 'Total Warnings', value: `${warningCount}` }
                        ],
                        color: 0xFFD700,
                        timestamp: new Date()
                    }]
                });
            }

            // Automatic actions based on warning count
            if (warningCount >= 5) {
                try {
                    await interaction.guild.members.ban(target, { reason: 'Exceeded maximum warnings (5)' });
                    return interaction.reply({
                        content: `${target.tag} has been automatically banned for exceeding 5 warnings.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Could not auto-ban user:', error);
                }
            } else if (warningCount >= 3) {
                const member = await interaction.guild.members.fetch(target.id);
                try {
                    await member.timeout(24 * 60 * 60 * 1000, 'Exceeded 3 warnings');
                } catch (error) {
                    console.error('Could not timeout user:', error);
                }
            }

            return interaction.reply({
                content: `Successfully warned ${target.tag}. They now have ${warningCount} warning(s).`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to warn the user.',
                ephemeral: true
            });
        }
    }
};
