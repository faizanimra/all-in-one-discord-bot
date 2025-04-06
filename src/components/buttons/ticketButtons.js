import { 
    ChannelType, 
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';
import Guild from '../../models/Guild.js';
import Ticket from '../../models/Ticket.js';

export async function handleTicketButtons(interaction) {
    if (interaction.customId === 'create_ticket') {
        await handleCreateTicket(interaction);
    } else if (interaction.customId === 'close_ticket') {
        await handleCloseTicket(interaction);
    } else if (interaction.customId === 'delete_ticket') {
        await handleDeleteTicket(interaction);
    }
}

async function handleCreateTicket(interaction) {
    try {
        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData) {
            return interaction.reply({
                content: '❌ Ticket system is not set up properly.',
                ephemeral: true
            });
        }

        // Check if user already has an open ticket
        const existingTicket = await Ticket.findOne({
            guildId: interaction.guild.id,
            creatorId: interaction.user.id,
            status: 'OPEN'
        });

        if (existingTicket) {
            return interaction.reply({
                content: `❌ You already have an open ticket: <#${existingTicket.channelId}>`,
                ephemeral: true
            });
        }

        // Get ticket count for numbering
        const ticketCount = await Ticket.countDocuments({ guildId: interaction.guild.id }) + 1;

        // Create ticket channel
        const channel = await interaction.guild.channels.create({
            name: `ticket-${ticketCount}`,
            type: ChannelType.GuildText,
            parent: guildData.settings.ticketCategory,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                },
                ...guildData.tickets.supportRoles.map(roleId => ({
                    id: roleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }))
            ]
        });

        // Create ticket in database
        const ticket = new Ticket({
            guildId: interaction.guild.id,
            channelId: channel.id,
            creatorId: interaction.user.id,
            ticketNumber: ticketCount
        });
        await ticket.save();

        // Create ticket message
        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${ticketCount}`)
            .setDescription('Support will be with you shortly.\nPlease describe your issue in detail.')
            .setColor(0x00FF00)
            .addFields(
                { name: 'Created by', value: `${interaction.user}` },
                { name: 'Created at', value: new Date().toLocaleString() }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

        await channel.send({
            content: `${interaction.user} Welcome to your ticket! Support team will assist you shortly.`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: `✅ Your ticket has been created: ${channel}`,
            ephemeral: true
        });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: '❌ There was an error creating your ticket.',
            ephemeral: true
        });
    }
}

async function handleCloseTicket(interaction) {
    try {
        const ticket = await Ticket.findOne({
            channelId: interaction.channel.id,
            status: 'OPEN'
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This ticket is already closed or does not exist.',
                ephemeral: true
            });
        }

        // Update ticket status
        ticket.status = 'CLOSED';
        ticket.closedBy = interaction.user.id;
        ticket.closedAt = new Date();
        await ticket.save();

        // Create transcript
        const messages = await interaction.channel.messages.fetch();
        const transcript = messages.reverse().map(m => {
            return `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`;
        }).join('\n');

        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        const transcriptChannel = interaction.guild.channels.cache.get(guildData.settings.transcriptChannel);

        if (transcriptChannel) {
            const transcriptEmbed = new EmbedBuilder()
                .setTitle(`Ticket #${ticket.ticketNumber} Transcript`)
                .setDescription('Ticket has been closed')
                .addFields(
                    { name: 'Created by', value: `<@${ticket.creatorId}>` },
                    { name: 'Closed by', value: `${interaction.user}` },
                    { name: 'Created at', value: ticket.createdAt.toLocaleString() },
                    { name: 'Closed at', value: new Date().toLocaleString() }
                )
                .setColor(0xFF0000);

            await transcriptChannel.send({
                embeds: [transcriptEmbed],
                files: [{
                    attachment: Buffer.from(transcript),
                    name: `ticket-${ticket.ticketNumber}-transcript.txt`
                }]
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('delete_ticket')
                    .setLabel('Delete Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️')
            );

        await interaction.reply({
            content: '✅ Ticket has been closed. Channel will be deleted in 5 minutes unless reopened.',
            components: [row]
        });

        // Delete channel after 5 minutes
        setTimeout(async () => {
            const updatedTicket = await Ticket.findOne({ channelId: interaction.channel.id });
            if (updatedTicket.status === 'CLOSED') {
                await interaction.channel.delete();
            }
        }, 300000);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: '❌ There was an error closing the ticket.',
            ephemeral: true
        });
    }
}

async function handleDeleteTicket(interaction) {
    try {
        await interaction.reply('🗑️ Deleting ticket channel...');
        await interaction.channel.delete();
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: '❌ There was an error deleting the ticket.',
            ephemeral: true
        });
    }
}
