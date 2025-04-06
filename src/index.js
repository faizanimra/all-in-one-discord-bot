import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { DisTube } from 'distube';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import mongoose from 'mongoose';
import { setupLocalization } from './utils/i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Create client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize collections
client.commands = new Collection();
client.selectMenus = new Collection();
client.buttons = new Collection();

// Initialize DisTube
client.distube = new DisTube(client, {
    leaveOnStop: false,
    leaveOnFinish: false,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(console.error);

// Initialize localization
setupLocalization();

// Load handlers
const handlersDir = join(__dirname, 'handlers');
const handlerFiles = readdirSync(handlersDir).filter(file => file.endsWith('.js'));

for (const file of handlerFiles) {
    const { default: handler } = await import(`./handlers/${file}`);
    await handler(client);
}

// Login to Discord
client.login(process.env.BOT_TOKEN);
