import { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a custom embed message')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('embed_creator')
            .setTitle('Create Custom Embed');

        // Title input
        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Embed Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the title for your embed')
            .setRequired(true)
            .setMaxLength(256);

        // Description input
        const descriptionInput = new TextInputBuilder()
            .setCustomId('embed_description')
            .setLabel('Embed Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter the description for your embed')
            .setRequired(true)
            .setMaxLength(4000);

        // Color input
        const colorInput = new TextInputBuilder()
            .setCustomId('embed_color')
            .setLabel('Embed Color (Hex code)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#FF0000')
            .setRequired(false)
            .setMaxLength(7);

        // Footer input
        const footerInput = new TextInputBuilder()
            .setCustomId('embed_footer')
            .setLabel('Embed Footer')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the footer text (optional)')
            .setRequired(false)
            .setMaxLength(2048);

        // Image URL input
        const imageInput = new TextInputBuilder()
            .setCustomId('embed_image')
            .setLabel('Image URL')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter an image URL (optional)')
            .setRequired(false);

        // Add inputs to modal
        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(footerInput),
            new ActionRowBuilder().addComponents(imageInput)
        );

        await interaction.showModal(modal);
    }
};

export async function handleEmbedModal(interaction) {
    try {
        const title = interaction.fields.getTextInputValue('embed_title');
        const description = interaction.fields.getTextInputValue('embed_description');
        const color = interaction.fields.getTextInputValue('embed_color') || '#00FF00';
        const footer = interaction.fields.getTextInputValue('embed_footer');
        const imageUrl = interaction.fields.getTextInputValue('embed_image');

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color.replace('#', '0x'))
            .setTimestamp();

        if (footer) {
            embed.setFooter({ text: footer });
        }

        if (imageUrl) {
            try {
                embed.setImage(imageUrl);
            } catch (error) {
                console.error('Invalid image URL:', error);
            }
        }

        // Add author info
        embed.setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL()
        });

        // Preview buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_send')
                    .setLabel('Send')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('embed_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            content: 'Preview of your embed:',
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error creating your embed!',
            ephemeral: true
        });
    }
}

export async function handleEmbedButton(interaction) {
    if (interaction.customId === 'embed_send') {
        // Send the embed to the channel
        await interaction.channel.send({
            embeds: [interaction.message.embeds[0]]
        });

        await interaction.update({
            content: 'Embed sent!',
            embeds: [],
            components: [],
            ephemeral: true
        });
    } else if (interaction.customId === 'embed_cancel') {
        await interaction.update({
            content: 'Embed cancelled!',
            embeds: [],
            components: [],
            ephemeral: true
        });
    }
}
