import mongoose from 'mongoose';

const reactionRoleSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    roleId: { type: String, required: true },
    emoji: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

reactionRoleSchema.index({ messageId: 1, emoji: 1 }, { unique: true });

export default mongoose.model('ReactionRole', reactionRoleSchema);
