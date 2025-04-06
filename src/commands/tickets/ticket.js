import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';
import Guild from '../../models/Guild.js';
import Ticket from '../../models/Ticket.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket system')
                .addChannelOption(option =>
                    option
                        .setName('category')
                        .setDescription('Category for ticket channels')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory))
                .addChannelOption(option =>
                    option
                        .setName('transcripts')
                        .setDescription('Channel for ticket transcripts')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText))
                .addRoleOption(option =>
                    option
                        .setName('support')
                        .setDescription('Support team role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Create a ticket panel'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            const category = interaction.options.getChannel('category');
            const transcripts = interaction.options.getChannel('transcripts');
            const supportRole = interaction.options.getRole('support');

            try {
                await Guild.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    {
                        $set: {
                            'tickets.supportRoles': [supportRole.id],
                            'settings.ticketCategory': category.id,
                            'settings.transcriptChannel': transcripts.id
                        }
                    },
                    { upsert: true }
                );

                await interaction.reply({
                    content: '✅ Ticket system has been set up successfully!',
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ There was an error setting up the ticket system.',
                    ephemeral: true
                });
            }
        } else if (subcommand === 'panel') {
            const embed = new EmbedBuilder()
                .setTitle('🎫 Support Tickets')
                .setDescription('Click the button below to create a support ticket.')
                .setColor(0x00FF00);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

            await interaction.channel.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: '✅ Ticket panel has been created!',
                ephemeral: true
            });
        }
    }
};
