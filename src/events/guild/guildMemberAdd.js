import { updateMemberStats } from '../../handlers/statsHandler.js';

export default {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            await updateMemberStats(member, 'join');
        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    }
};
