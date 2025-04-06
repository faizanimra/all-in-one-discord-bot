import { handleVoiceStateUpdate } from '../../handlers/xpHandler.js';
import { updateVoiceStats } from '../../handlers/statsHandler.js';

export default {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        try {
            // Handle XP for voice activity
            await handleVoiceStateUpdate(oldState, newState);

            // Update voice stats
            await updateVoiceStats(oldState, newState);
        } catch (error) {
            console.error('Error in voiceStateUpdate event:', error);
        }
    }
};
