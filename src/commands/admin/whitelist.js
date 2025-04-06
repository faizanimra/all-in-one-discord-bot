import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translate } from '../../utils/i18n.js';
import AutoMod from '../../models/AutoMod.js';

export default {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage whitelisted domains')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a domain to the whitelist')
                .addStringOption(option =>
                    option.setName('domain')
                        .setDescription('The domain to whitelist (e.g., discord.com)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a domain from the whitelist')
                .addStringOption(option =>
                    option.setName('domain')
                        .setDescription('The domain to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all whitelisted domains')),

    async execute(interaction, userLang) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let automod = await AutoMod.findOne({ guildId: interaction.guild.id });
            if (!automod) {
                automod = new AutoMod({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'add': {
                    const domain = interaction.options.getString('domain')
                        .toLowerCase()
                        .replace(/^(https?:\/\/)?(www\.)?/, '');

                    if (automod.features.antiLink.whitelistedDomains.includes(domain)) {
                        return interaction.reply({
                            content: translate('automod.domain_already_whitelisted', {
                                lng: userLang,
                                domain: domain
                            }),
                            ephemeral: true
                        });
                    }

                    automod.features.antiLink.whitelistedDomains.push(domain);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.domain_whitelisted', {
                            lng: userLang,
                            domain: domain
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    const domain = interaction.options.getString('domain')
                        .toLowerCase()
                        .replace(/^(https?:\/\/)?(www\.)?/, '');

                    if (!automod.features.antiLink.whitelistedDomains.includes(domain)) {
                        return interaction.reply({
                            content: translate('automod.domain_not_whitelisted', {
                                lng: userLang,
                                domain: domain
                            }),
                            ephemeral: true
                        });
                    }

                    automod.features.antiLink.whitelistedDomains = 
                        automod.features.antiLink.whitelistedDomains.filter(d => d !== domain);
                    await automod.save();

                    await interaction.reply({
                        content: translate('automod.domain_removed', {
                            lng: userLang,
                            domain: domain
                        }),
                        ephemeral: true
                    });
                    break;
                }

                case 'list': {
                    const domains = automod.features.antiLink.whitelistedDomains;
                    if (domains.length === 0) {
                        return interaction.reply({
                            content: translate('automod.no_whitelisted_domains', { lng: userLang }),
                            ephemeral: true
                        });
                    }

                    await interaction.reply({
                        content: translate('automod.whitelisted_domains', {
                            lng: userLang,
                            domains: domains.join('\n')
                        }),
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error managing whitelisted domains:', error);
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
