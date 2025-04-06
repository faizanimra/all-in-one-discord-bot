import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import ReactionRole from '../../models/ReactionRole.js';

export default {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Manage reaction roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a reaction role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to give')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji to react with')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description of the role')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a reaction role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all reaction roles')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'add': {
                    const role = interaction.options.getRole('role');
                    const emoji = interaction.options.getString('emoji');
                    const description = interaction.options.getString('description') || '';

                    // Create embed for reaction role
                    const embed = new EmbedBuilder()
                        .setTitle(translate('reaction_roles.title', { lng: userLang }))
                        .setDescription(translate('reaction_roles.instructions', { lng: userLang }))
                        .addFields({
                            name: role.name,
                            value: `${emoji} ${description}`
                        })
                        .setColor('#00ff00')
                        .setFooter({ text: translate('reaction_roles.footer', { lng: userLang }) });

                    // Send message and add initial reaction
                    const message = await interaction.channel.send({ embeds: [embed] });
                    await message.react(emoji);

                    // Save reaction role to database
                    await ReactionRole.create({
                        guildId: interaction.guild.id,
                        channelId: interaction.channel.id,
                        messageId: message.id,
                        roleId: role.id,
                        emoji: emoji,
                        description: description
                    });

                    await interaction.reply({
                        content: translate('reaction_roles.added', {
                            lng: userLang,
                            role: role.name,
                            emoji: emoji
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    const role = interaction.options.getRole('role');
                    const reactionRoles = await ReactionRole.find({
                        guildId: interaction.guild.id,
                        roleId: role.id
                    });

                    if (reactionRoles.length === 0) {
                        return interaction.reply({
                            content: translate('reaction_roles.not_found', {
                                lng: userLang,
                                role: role.name
                            }),
                            ephemeral: true
                        });
                    }

                    // Delete messages and database entries
                    for (const rr of reactionRoles) {
                        try {
                            const channel = await interaction.guild.channels.fetch(rr.channelId);
                            const message = await channel.messages.fetch(rr.messageId);
                            await message.delete();
                        } catch (error) {
                            console.error('Error deleting reaction role message:', error);
                        }
                    }

                    await ReactionRole.deleteMany({
                        guildId: interaction.guild.id,
                        roleId: role.id
                    });

                    await interaction.reply({
                        content: translate('reaction_roles.removed', {
                            lng: userLang,
                            role: role.name
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'list': {
                    const reactionRoles = await ReactionRole.find({
                        guildId: interaction.guild.id
                    });

                    if (reactionRoles.length === 0) {
                        return interaction.reply({
                            content: translate('reaction_roles.none_found', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(translate('reaction_roles.list_title', { lng: userLang }))
                        .setColor('#0099ff');

                    const roleMap = new Map();
                    for (const rr of reactionRoles) {
                        const role = await interaction.guild.roles.fetch(rr.roleId);
                        if (role) {
                            roleMap.set(role.id, {
                                name: role.name,
                                emoji: rr.emoji,
                                description: rr.description
                            });
                        }
                    }

                    const description = Array.from(roleMap.values())
                        .map(r => `${r.emoji} **${r.name}** - ${r.description || ''}`)
                        .join('\n');

                    embed.setDescription(description);
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing reaction roles:', error);
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
