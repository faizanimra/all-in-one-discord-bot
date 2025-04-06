import mongoose from 'mongoose';

const autoModSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    features: {
        antiSpam: {
            enabled: { type: Boolean, default: true },
            maxMessages: { type: Number, default: 5 },
            timeWindow: { type: Number, default: 5 }, // seconds
            punishment: { type: String, default: 'mute' }, // mute, kick, ban
            muteDuration: { type: Number, default: 5 } // minutes
        },
        antiLink: {
            enabled: { type: Boolean, default: true },
            whitelistedDomains: [String],
            punishment: { type: String, default: 'delete' } // delete, mute, kick, ban
        },
        badWords: {
            enabled: { type: Boolean, default: true },
            words: [String],
            punishment: { type: String, default: 'delete' }
        },
        mentionSpam: {
            enabled: { type: Boolean, default: true },
            maxMentions: { type: Number, default: 5 },
            punishment: { type: String, default: 'mute' }
        },
        caps: {
            enabled: { type: Boolean, default: true },
            percentage: { type: Number, default: 70 }, // max percentage of caps
            minLength: { type: Number, default: 10 }, // minimum message length to check
            punishment: { type: String, default: 'delete' }
        }
    },
    ignoredChannels: [String],
    ignoredRoles: [String],
    logChannel: String
});

autoModSchema.index({ guildId: 1 }, { unique: true });

export default mongoose.model('AutoMod', autoModSchema);
