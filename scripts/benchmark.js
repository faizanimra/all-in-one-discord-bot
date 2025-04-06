import { performance } from 'perf_hooks';
import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

class BotBenchmark {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates
            ]
        });
        this.results = {
            startup: {},
            commands: {},
            database: {},
            memory: {}
        };
    }

    async start() {
        console.log('🔬 Starting Bot Benchmark\n');

        try {
            await this.benchmarkStartup();
            await this.benchmarkCommands();
            await this.benchmarkDatabase();
            await this.benchmarkMemory();
            
            this.displayResults();
        } catch (error) {
            console.error('Benchmark failed:', error);
        } finally {
            await this.cleanup();
        }
    }

    async benchmarkStartup() {
        console.log('Testing startup performance...');
        
        // Measure client login
        const loginStart = performance.now();
        await this.client.login(process.env.BOT_TOKEN);
        this.results.startup.login = performance.now() - loginStart;

        // Measure command loading
        const commandStart = performance.now();
        const { loadCommands } = await import('../src/handlers/commandHandler.js');
        await loadCommands(this.client);
        this.results.startup.commandLoading = performance.now() - commandStart;

        // Measure event loading
        const eventStart = performance.now();
        const { loadEvents } = await import('../src/handlers/eventHandler.js');
        await loadEvents(this.client);
        this.results.startup.eventLoading = performance.now() - eventStart;
    }

    async benchmarkCommands() {
        console.log('Testing command performance...');
        
        const commands = this.client.commands.map(cmd => cmd.data.name);
        
        for (const command of commands) {
            const start = performance.now();
            try {
                const cmd = this.client.commands.get(command);
                await cmd.execute({ client: this.client }); // Mock interaction
                this.results.commands[command] = performance.now() - start;
            } catch (error) {
                this.results.commands[command] = 'Failed';
            }
        }
    }

    async benchmarkDatabase() {
        console.log('Testing database performance...');
        
        // Connect to MongoDB
        const connectStart = performance.now();
        await mongoose.connect(process.env.MONGODB_URI);
        this.results.database.connection = performance.now() - connectStart;

        // Test write performance
        const writeStart = performance.now();
        const testDoc = new mongoose.model('BenchmarkTest', new mongoose.Schema({
            test: String,
            timestamp: Date
        }));
        await testDoc.create({ test: 'benchmark', timestamp: new Date() });
        this.results.database.write = performance.now() - writeStart;

        // Test read performance
        const readStart = performance.now();
        await testDoc.findOne({ test: 'benchmark' });
        this.results.database.read = performance.now() - readStart;

        // Cleanup test collection
        await mongoose.connection.dropCollection('benchmarktests');
    }

    async benchmarkMemory() {
        console.log('Testing memory usage...');
        
        const used = process.memoryUsage();
        this.results.memory = {
            heapTotal: this.formatBytes(used.heapTotal),
            heapUsed: this.formatBytes(used.heapUsed),
            external: this.formatBytes(used.external),
            rss: this.formatBytes(used.rss)
        };
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    formatMs(ms) {
        return `${Math.round(ms)}ms`;
    }

    displayResults() {
        console.log('\n📊 Benchmark Results\n');

        console.log('Startup Performance:');
        console.log('- Client Login:', this.formatMs(this.results.startup.login));
        console.log('- Command Loading:', this.formatMs(this.results.startup.commandLoading));
        console.log('- Event Loading:', this.formatMs(this.results.startup.eventLoading));

        console.log('\nCommand Performance:');
        Object.entries(this.results.commands).forEach(([command, time]) => {
            console.log(`- ${command}: ${typeof time === 'number' ? this.formatMs(time) : time}`);
        });

        console.log('\nDatabase Performance:');
        console.log('- Connection:', this.formatMs(this.results.database.connection));
        console.log('- Write:', this.formatMs(this.results.database.write));
        console.log('- Read:', this.formatMs(this.results.database.read));

        console.log('\nMemory Usage:');
        Object.entries(this.results.memory).forEach(([key, value]) => {
            console.log(`- ${key}: ${value}`);
        });
    }

    async cleanup() {
        await this.client.destroy();
        await mongoose.disconnect();
    }
}

// Run benchmark
const benchmark = new BotBenchmark();
benchmark.start();
