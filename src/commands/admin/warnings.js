import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import User from '../../models/User.js';
import moment from 'moment';

export default {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check warnings for a user')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to check warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');

        try {
            const user = await User.findOne({
                userId: target.id,
                guildId: interaction.guild.id
            });

            if (!user || !user.warnings || user.warnings.length === 0) {
                return interaction.reply({
                    content: `${target.tag} has no warnings.`,
                    ephemeral: true
                });
            }

            const warningList = await Promise.all(user.warnings.map(async (warning, index) => {
                const moderator = await interaction.client.users.fetch(warning.moderator);
                return {
                    name: `Warning ${index + 1}`,
                    value: `**Reason:** ${warning.reason}\n**By:** ${moderator.tag}\n**Date:** ${moment(warning.timestamp).format('YYYY-MM-DD HH:mm:ss')}`
                };
            }));

            return interaction.reply({
                embeds: [{
                    title: `Warnings for ${target.tag}`,
                    fields: warningList,
                    color: 0xFFD700,
                    footer: {
                        text: `Total Warnings: ${user.warnings.length}`
                    },
                    timestamp: new Date()
                }],
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to fetch warnings.',
                ephemeral: true
            });
        }
    }
};
