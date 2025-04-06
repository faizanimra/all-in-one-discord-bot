import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Client, GatewayIntentBits } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function validate() {
    console.log('🔍 Environment Validation\n');
    let hasErrors = false;

    try {
        // Check required variables
        const requiredVars = [
            'BOT_TOKEN',
            'CLIENT_ID',
            'MONGODB_URI'
        ];

        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                console.error(`❌ Missing required environment variable: ${varName}`);
                hasErrors = true;
            }
        }

        if (hasErrors) {
            console.error('\n❌ Environment validation failed');
            return;
        }

        // Test MongoDB connection
        console.log('Testing MongoDB connection...');
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ MongoDB connection successful');
            await mongoose.disconnect();
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            hasErrors = true;
        }

        // Test Discord bot token
        console.log('\nTesting Discord bot token...');
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });
        try {
            await client.login(process.env.BOT_TOKEN);
            console.log('✅ Discord bot token is valid');
            await client.destroy();
        } catch (error) {
            console.error('❌ Discord bot token is invalid:', error.message);
            hasErrors = true;
        }

        // Check optional variables
        const optionalVars = {
            'GUILD_ID': 'Server ID for development commands',
            'MOD_LOGS_CHANNEL': 'Channel for moderation logs',
            'ERROR_LOGS_CHANNEL': 'Channel for error logs',
            'JOIN_LEAVE_CHANNEL': 'Channel for member join/leave logs',
            'AUTOMOD_LOGS_CHANNEL': 'Channel for automod logs',
            'VOICE_LOGS_CHANNEL': 'Channel for voice activity logs',
            'SERVER_STATS_CHANNEL': 'Channel for server statistics'
        };

        console.log('\nChecking optional configuration:');
        for (const [varName, description] of Object.entries(optionalVars)) {
            if (process.env[varName]) {
                console.log(`✅ ${varName}: Configured`);
            } else {
                console.log(`⚠️ ${varName}: Not configured (${description})`);
            }
        }

        // Check for valid numeric values
        const numericVars = [
            'AUTOMOD_MAX_MENTIONS',
            'AUTOMOD_MAX_MESSAGES',
            'AUTOMOD_MAX_LINKS',
            'AUTOMOD_MAX_CAPS_PERCENT',
            'XP_PER_MESSAGE',
            'XP_PER_VOICE_MINUTE',
            'XP_COOLDOWN_SECONDS',
            'STATS_UPDATE_INTERVAL',
            'MAX_REACTION_ROLES'
        ];

        console.log('\nValidating numeric configurations:');
        for (const varName of numericVars) {
            const value = process.env[varName];
            if (value && !isNaN(value)) {
                console.log(`✅ ${varName}: Valid number (${value})`);
            } else if (value) {
                console.log(`❌ ${varName}: Invalid number (${value})`);
                hasErrors = true;
            }
        }

        if (hasErrors) {
            console.error('\n❌ Environment validation failed');
        } else {
            console.log('\n🎉 All validations passed successfully!');
        }

    } catch (error) {
        console.error('\n❌ Validation error:', error);
    }
}

validate();
