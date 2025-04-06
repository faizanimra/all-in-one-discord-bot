import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for banning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        // Check if the target is bannable
        const targetMember = await interaction.guild.members.fetch(target.id);
        if (!targetMember.bannable) {
            return interaction.reply({
                content: 'I cannot ban this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        try {
            await targetMember.ban({ reason });
            
            // Log the ban
            const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        title: '🔨 User Banned',
                        fields: [
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Reason', value: reason }
                        ],
                        color: 0xFF0000,
                        timestamp: new Date()
                    }]
                });
            }

            return interaction.reply({
                content: `Successfully banned ${target.tag} for: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while trying to ban the user.',
                ephemeral: true
            });
        }
    }
};
