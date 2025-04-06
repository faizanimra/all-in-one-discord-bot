import { updateMemberStats } from '../../handlers/statsHandler.js';

export default {
    name: 'guildMemberRemove',
    async execute(member) {
        try {
            await updateMemberStats(member, 'leave');
        } catch (error) {
            console.error('Error in guildMemberRemove event:', error);
        }
    }
};
