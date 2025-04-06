class CleanupHandler {
    constructor(client) {
        this.client = client;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle graceful shutdown
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
        
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.cleanup();
        });
        
        process.on('unhandledRejection', (error) => {
            console.error('Unhandled Rejection:', error);
            this.cleanup();
        });
    }

    async cleanup() {
        console.log('Performing cleanup...');

        try {
            // Stop all tasks
            if (this.client.taskHandler) {
                this.client.taskHandler.stopAll();
            }

            // Save any pending stats
            for (const guild of this.client.guilds.cache.values()) {
                try {
                    // Update final stats before shutdown
                    const updateStats = (await import('../tasks/updateStats.js')).default;
                    await updateStats.execute(this.client);
                } catch (error) {
                    console.error(`Error updating final stats for guild ${guild.id}:`, error);
                }
            }

            // Close database connection if exists
            if (this.client.mongoose) {
                await this.client.mongoose.disconnect();
            }

            console.log('Cleanup completed');
            process.exit(0);
        } catch (error) {
            console.error('Error during cleanup:', error);
            process.exit(1);
        }
    }
}

export default CleanupHandler;
