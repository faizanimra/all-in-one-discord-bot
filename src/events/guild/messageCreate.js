import { handleMessageXP } from '../../handlers/xpHandler.js';
import { checkAntiSpam, checkAntiLink, checkBadWords, checkMentionSpam, checkCaps } from '../../utils/security.js';
import { updateMessageStats } from '../../handlers/statsHandler.js';
import User from '../../models/User.js';

export default {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        try {
            // Handle XP gain
            await handleMessageXP(message);

            // Update server stats
            await updateMessageStats(message);

            // Security checks
            await Promise.all([
                checkAntiSpam(message),
                checkAntiLink(message),
                checkBadWords(message),
                checkMentionSpam(message),
                checkCaps(message)
            ]);

            // Update message count
            await User.findOneAndUpdate(
                {
                    userId: message.author.id,
                    guildId: message.guild.id
                },
                {
                    $inc: { messageCount: 1 },
                    $set: { lastMessageTimestamp: new Date() }
                },
                { upsert: true }
            );
        } catch (error) {
            console.error('Error in messageCreate event:', error);
        }
    }
};
