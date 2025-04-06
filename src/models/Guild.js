import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    settings: {
        prefix: { type: String, default: '!' },
        language: { type: String, default: 'en' },
        modLogChannel: String,
        welcomeChannel: String,
        ticketCategory: String,
        transcriptChannel: String,
        autoRole: String,
        djRole: String
    },
    security: {
        antiSpam: { type: Boolean, default: true },
        maxMessages: { type: Number, default: 5 },
        timeWindow: { type: Number, default: 5000 },
        antiLink: { type: Boolean, default: true },
        antiRaid: { type: Boolean, default: true },
        raidThreshold: { type: Number, default: 10 },
        raidTimeWindow: { type: Number, default: 10000 },
        whitelistedLinks: [String],
        blacklistedWords: [String]
    },
    tickets: {
        count: { type: Number, default: 0 },
        supportRoles: [String],
        categories: [{
            name: String,
            description: String,
            supportRoles: [String]
        }]
    }
});

export default mongoose.model('Guild', guildSchema);
