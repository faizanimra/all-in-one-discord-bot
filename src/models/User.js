import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    language: { type: String, default: 'en' },
    warnings: { type: Number, default: 0 },
    isMuted: { type: Boolean, default: false },
    muteExpires: { type: Date },
    lastMessageTimestamp: { type: Date },
    messageCount: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastXpGain: { type: Date },
    totalVoiceTime: { type: Number, default: 0 }, // in minutes
    voiceJoinedAt: { type: Date }
});

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// Calculate XP needed for next level
userSchema.methods.xpForNextLevel = function() {
    return 5 * (Math.pow(this.level, 2)) + 50 * this.level + 100;
};

// Check if user can level up
userSchema.methods.checkLevelUp = function() {
    const xpNeeded = this.xpForNextLevel();
    if (this.xp >= xpNeeded) {
        this.level += 1;
        return true;
    }
    return false;
};

export default mongoose.model('User', userSchema);
