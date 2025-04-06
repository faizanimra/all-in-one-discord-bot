import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    creatorId: { type: String, required: true },
    ticketNumber: { type: Number, required: true },
    category: String,
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED', 'ARCHIVED'],
        default: 'OPEN'
    },
    createdAt: { type: Date, default: Date.now },
    closedAt: Date,
    closedBy: String,
    messages: [{
        author: String,
        content: String,
        timestamp: Date,
        attachments: [String]
    }]
});

export default mongoose.model('Ticket', ticketSchema);
