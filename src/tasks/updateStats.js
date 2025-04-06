import { updateActiveMembers } from '../handlers/statsHandler.js';

export default {
    name: 'updateStats',
    interval: 1000 * 60 * 60, // Run every hour
    async execute(client) {
        try {
            for (const guild of client.guilds.cache.values()) {
                await updateActiveMembers(guild);
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
};
