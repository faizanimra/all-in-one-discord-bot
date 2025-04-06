import os from 'os';
import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class BotMonitor {
    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds]
        });
        this.startTime = Date.now();
    }

    async start() {
        try {
            await this.client.login(process.env.BOT_TOKEN);
            await mongoose.connect(process.env.MONGODB_URI);
            
            setInterval(() => this.collectMetrics(), 60000); // Every minute
            console.log('🔍 Monitoring started');
        } catch (error) {
            console.error('Error starting monitor:', error);
            process.exit(1);
        }
    }

    async collectMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            system: {
                cpu: os.loadavg(),
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem()
                },
                uptime: os.uptime()
            },
            bot: {
                uptime: Date.now() - this.startTime,
                guilds: this.client.guilds.cache.size,
                ping: this.client.ws.ping,
                commands: this.client.application?.commands.cache.size || 0
            },
            database: {
                collections: Object.keys(mongoose.connection.collections).length,
                status: mongoose.connection.readyState
            }
        };

        // Log metrics
        console.log('\n=== Bot Metrics ===');
        console.log(`Time: ${metrics.timestamp}`);
        
        console.log('\nSystem:');
        console.log(`CPU Load: ${metrics.system.cpu.join(', ')}`);
        console.log(`Memory: ${this.formatBytes(metrics.system.memory.used)} / ${this.formatBytes(metrics.system.memory.total)}`);
        console.log(`Uptime: ${this.formatUptime(metrics.system.uptime)}`);
        
        console.log('\nBot:');
        console.log(`Uptime: ${this.formatUptime(metrics.bot.uptime / 1000)}`);
        console.log(`Guilds: ${metrics.bot.guilds}`);
        console.log(`Ping: ${metrics.bot.ping}ms`);
        console.log(`Commands: ${metrics.bot.commands}`);
        
        console.log('\nDatabase:');
        console.log(`Collections: ${metrics.database.collections}`);
        console.log(`Status: ${this.getDatabaseStatus(metrics.database.status)}`);
        
        // Check for warnings
        this.checkWarnings(metrics);
    }

    checkWarnings(metrics) {
        const warnings = [];

        // Memory usage > 90%
        const memoryUsage = metrics.system.memory.used / metrics.system.memory.total;
        if (memoryUsage > 0.9) {
            warnings.push('⚠️ High memory usage!');
        }

        // High CPU load
        if (metrics.system.cpu[0] > 2) {
            warnings.push('⚠️ High CPU load!');
        }

        // High ping
        if (metrics.bot.ping > 500) {
            warnings.push('⚠️ High latency!');
        }

        // Database issues
        if (metrics.database.status !== 1) {
            warnings.push('⚠️ Database connection issues!');
        }

        if (warnings.length > 0) {
            console.log('\nWarnings:');
            warnings.forEach(warning => console.log(warning));
        }
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    getDatabaseStatus(status) {
        const states = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting'
        };
        return states[status] || 'Unknown';
    }
}

// Start monitoring
const monitor = new BotMonitor();
monitor.start();
