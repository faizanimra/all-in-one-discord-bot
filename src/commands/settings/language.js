import { SlashCommandBuilder } from 'discord.js';
import User from '../../models/User.js';
import { translate } from '../../utils/i18n.js';

const SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Español'
};

export default {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Change your preferred language')
        .addStringOption(option =>
            option
                .setName('language')
                .setDescription('Select your preferred language')
                .setRequired(true)
                .addChoices(
                    ...Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
                        name,
                        value: code
                    }))
                )),

    async execute(interaction) {
        const languageCode = interaction.options.getString('language');
        
        try {
            await User.findOneAndUpdate(
                { 
                    userId: interaction.user.id,
                    guildId: interaction.guild.id
                },
                {
                    $set: { language: languageCode }
                },
                { upsert: true }
            );

            // Use the new language for the response
            const response = translate('common.success', { lng: languageCode });
            await interaction.reply({
                content: `✅ ${response}\n🌐 ${SUPPORTED_LANGUAGES[languageCode]} (${languageCode})`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            const errorMsg = translate('common.error', {
                lng: languageCode,
                error: error.message
            });
            await interaction.reply({
                content: errorMsg,
                ephemeral: true
            });
        }
    }
};
