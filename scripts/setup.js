import { promises as fs } from 'fs';
import { join } from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.log('🤖 All-In-One Discord Bot Setup\n');

    try {
        // Check if .env exists
        const envPath = join(__dirname, '..', '.env');
        const envExamplePath = join(__dirname, '..', '.env.example');
        
        if (await fs.access(envPath).then(() => true).catch(() => false)) {
            console.log('⚠️ .env file already exists. Would you like to overwrite it?');
            const overwrite = await question('Enter y/N: ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('❌ Setup cancelled');
                process.exit(0);
            }
        }

        // Read .env.example
        const envExample = await fs.readFile(envExamplePath, 'utf8');
        let envContent = envExample;

        // Get bot token
        console.log('\n🔑 Bot Token Setup');
        console.log('Get your bot token from https://discord.com/developers/applications');
        const token = await question('Enter your bot token: ');
        envContent = envContent.replace('your_bot_token_here', token);

        // Get client ID
        console.log('\n📝 Client ID Setup');
        console.log('Get your client ID from your bot\'s application page');
        const clientId = await question('Enter your client ID: ');
        envContent = envContent.replace('your_client_id_here', clientId);

        // Get MongoDB URI
        console.log('\n🗄️ MongoDB Setup');
        console.log('Get your MongoDB URI from https://www.mongodb.com/cloud/atlas');
        const mongoUri = await question('Enter your MongoDB URI: ');
        envContent = envContent.replace('your_mongodb_uri_here', mongoUri);

        // Optional: Get guild ID
        console.log('\n🏠 Guild ID Setup (optional)');
        console.log('Right-click your server and copy ID (Developer Mode must be enabled)');
        const guildId = await question('Enter your guild ID (press Enter to skip): ');
        if (guildId) {
            envContent = envContent.replace('your_guild_id_here', guildId);
        }

        // Write .env file
        await fs.writeFile(envPath, envContent);

        console.log('\n✅ Setup completed successfully!');
        console.log('Your .env file has been created with the provided configuration.');
        console.log('\nNext steps:');
        console.log('1. Review the .env file and adjust any additional settings');
        console.log('2. Run npm install to install dependencies');
        console.log('3. Start the bot with npm run dev or npm start');

    } catch (error) {
        console.error('❌ Error during setup:', error);
    } finally {
        rl.close();
    }
}

setup();
