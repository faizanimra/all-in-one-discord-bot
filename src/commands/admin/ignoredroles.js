import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import AutoMod from '../../models/AutoMod.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ignoredroles')
        .setDescription('Manage roles ignored by automod')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to ignored list')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to ignore')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from ignored list')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all ignored roles')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let automod = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!automod) {
                automod = new AutoMod({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'add': {
                    const role = interaction.options.getRole('role');

                    if (automod.ignoredRoles.includes(role.id)) {
                        return interaction.reply({
                            content: translate('automod.role_already_ignored', {
                                lng: userLang,
                                role: role.name
                            }),
                            ephemeral: true
                        });
                    }

                    automod.ignoredRoles.push(role.id);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.role_ignored', {
                            lng: userLang,
                            role: role.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    const role = interaction.options.getRole('role');

                    if (!automod.ignoredRoles.includes(role.id)) {
                        return interaction.reply({
                            content: translate('automod.role_not_ignored', {
                                lng: userLang,
                                role: role.name
                            }),
                            ephemeral: true
                        });
                    }

                    automod.ignoredRoles = automod.ignoredRoles.filter(id => id !== role.id);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.role_unignored', {
                            lng: userLang,
                            role: role.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'list': {
                    const roles = automod.ignoredRoles
                        .map(id => interaction.guild.roles.cache.get(id))
                        .filter(role => role) // Filter out deleted roles
                        .map(role => role.name);

                    if (roles.length === 0) {
                        return interaction.reply({
                            content: translate('automod.no_ignored_roles', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    await interaction.reply({
                        content: translate('automod.ignored_roles_list', {
                            lng: userLang,
                            roles: roles.join('\n')
                        }),
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing ignored roles:', error);
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
