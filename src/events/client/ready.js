import TaskHandler from '../../handlers/taskHandler.js';
import updateStats from '../../tasks/updateStats.js';

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            // Initialize task handler
            client.taskHandler = new TaskHandler(client);
            
            // Register tasks
            client.taskHandler.registerTask(updateStats);

            // Initialize stats for all guilds
            for (const guild of client.guilds.cache.values()) {
                try {
                    // Update initial member count
                    await guild.members.fetch();
                    
                    // Update active members
                    await updateStats.execute(client);
                } catch (error) {
                    console.error(`Error initializing stats for guild ${guild.id}:`, error);
                }
            }

            console.log(`Ready! Logged in as ${client.user.tag}`);
        } catch (error) {
            console.error('Error in ready event:', error);
        }
    }
};
