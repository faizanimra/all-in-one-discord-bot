import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translate } from '../../utils/i18n.js';

export default {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles for users')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all roles of a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to list roles for')
                        .setRequired(true))),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (!target) {
            return interaction.reply({
                content: translate('common.invalid_user', { lng: userLang }),
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'add':
                    if (!role) {
                        return interaction.reply({
                            content: translate('common.invalid_role', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    if (!role.editable) {
                        return interaction.reply({
                            content: translate('admin.role.no_permission', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    await target.roles.add(role);
                    await interaction.reply({
                        content: translate('admin.role.added', {
                            lng: userLang,
                            user: target.user.tag,
                            role: role.name
                        }),
                        ephemeral: true
                    });
                    break;

                case 'remove':
                    if (!role) {
                        return interaction.reply({
                            content: translate('common.invalid_role', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    if (!role.editable) {
                        return interaction.reply({
                            content: translate('admin.role.no_permission', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    await target.roles.remove(role);
                    await interaction.reply({
                        content: translate('admin.role.removed', {
                            lng: userLang,
                            user: target.user.tag,
                            role: role.name
                        }),
                        ephemeral: true
                    });
                    break;

                case 'list':
                    const roles = target.roles.cache
                        .sort((a, b) => b.position - a.position)
                        .map(r => r.name)
                        .join(', ');

                    await interaction.reply({
                        content: translate('admin.role.list', {
                            lng: userLang,
                            user: target.user.tag,
                            roles: roles
                        }),
                        ephemeral: true
                    });
                    break;
            }

            // Log the role change
            const modLogsChannel = interaction.guild.channels.cache.get(process.env.MOD_LOGS_CHANNEL);
            if (modLogsChannel && subcommand !== 'list') {
                await modLogsChannel.send({
                    content: translate('admin.role.log', {
                        lng: userLang,
                        moderator: interaction.user.tag,
                        action: subcommand === 'add' ? 'added' : 'removed',
                        role: role.name,
                        user: target.user.tag
                    })
                });
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
