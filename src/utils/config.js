import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') });

// Bot Configuration
export const BOT_TOKEN = process.env.BOT_TOKEN;
export const CLIENT_ID = process.env.CLIENT_ID;
export const GUILD_ID = process.env.GUILD_ID;

// MongoDB Configuration
export const MONGODB_URI = process.env.MONGODB_URI;

// Lavalink Configuration
export const LAVALINK_CONFIG = {
    host: process.env.LAVALINK_HOST || 'localhost',
    port: parseInt(process.env.LAVALINK_PORT) || 2333,
    password: process.env.LAVALINK_PASSWORD || 'youshallnotpass'
};

// Logging Channels
export const CHANNELS = {
    modLogs: process.env.MOD_LOGS_CHANNEL,
    errorLogs: process.env.ERROR_LOGS_CHANNEL,
    joinLeave: process.env.JOIN_LEAVE_CHANNEL,
    automodLogs: process.env.AUTOMOD_LOGS_CHANNEL,
    voiceLogs: process.env.VOICE_LOGS_CHANNEL,
    serverStats: process.env.SERVER_STATS_CHANNEL
};

// Language Configuration
export const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || 'en';

// AutoMod Configuration
export const AUTOMOD_CONFIG = {
    maxMentions: parseInt(process.env.AUTOMOD_MAX_MENTIONS) || 5,
    maxMessages: parseInt(process.env.AUTOMOD_MAX_MESSAGES) || 5,
    maxLinks: parseInt(process.env.AUTOMOD_MAX_LINKS) || 3,
    maxCapsPercent: parseInt(process.env.AUTOMOD_MAX_CAPS_PERCENT) || 70,
    defaultMuteDuration: parseInt(process.env.AUTOMOD_DEFAULT_MUTE_DURATION) || 5
};

// XP System Configuration
export const XP_CONFIG = {
    perMessage: parseInt(process.env.XP_PER_MESSAGE) || 15,
    perVoiceMinute: parseInt(process.env.XP_PER_VOICE_MINUTE) || 5,
    cooldownSeconds: parseInt(process.env.XP_COOLDOWN_SECONDS) || 60
};

// Stats Configuration
export const STATS_CONFIG = {
    updateInterval: parseInt(process.env.STATS_UPDATE_INTERVAL) || 3600000,
    activeThresholdHours: parseInt(process.env.ACTIVE_THRESHOLD_HOURS) || 24
};

// Reaction Roles Configuration
export const REACTION_ROLES_CONFIG = {
    maxPerServer: parseInt(process.env.MAX_REACTION_ROLES) || 25,
    maxPerMessage: parseInt(process.env.MAX_ROLES_PER_MESSAGE) || 10
};

// Validate required environment variables
const requiredEnvVars = ['BOT_TOKEN', 'CLIENT_ID', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Export default config object
export default {
    BOT_TOKEN,
    CLIENT_ID,
    GUILD_ID,
    MONGODB_URI,
    LAVALINK_CONFIG,
    CHANNELS,
    DEFAULT_LANGUAGE,
    AUTOMOD_CONFIG,
    XP_CONFIG,
    STATS_CONFIG,
    REACTION_ROLES_CONFIG
};
