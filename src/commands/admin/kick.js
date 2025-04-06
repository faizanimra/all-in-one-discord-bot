import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        // Check if the target is kickable
        const targetMember = await interaction.guild.members.fetch(target.id);
        if (!targetMember.kickable) {
            return interaction.reply({
                content: 'I cannot kick this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        try {
            await targetMember.kick(reason);
            
            // Log the kick
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '👢 User Kicked',
                        fields: [
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Reason', value: reason }
                        ],
                        color: 0xFFA500,
                        timestamp: new Date()
                    }]
                });
            }

            return interaction.reply({
                content: `Successfully kicked ${target.tag} for: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to kick the user.',
                ephemeral: true
            });
        }
    }
};
