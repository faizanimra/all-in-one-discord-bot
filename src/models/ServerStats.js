import mongoose from 'mongoose';

const serverStatsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    totalMessages: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 }, // Members who sent a message in last 24h
    totalCommands: { type: Number, default: 0 },
    totalVoiceMinutes: { type: Number, default: 0 },
    channelStats: [{
        channelId: String,
        messageCount: { type: Number, default: 0 },
        lastMessage: Date
    }],
    memberActivity: [{
        date: { type: Date, required: true },
        joins: { type: Number, default: 0 },
        leaves: { type: Number, default: 0 }
    }],
    lastUpdated: { type: Date, default: Date.now }
});

// Keep only last 30 days of member activity
serverStatsSchema.pre('save', function(next) {
    if (this.memberActivity.length > 30) {
        this.memberActivity = this.memberActivity.slice(-30);
    }
    this.lastUpdated = new Date();
    next();
});

export default mongoose.model('ServerStats', serverStatsSchema);
