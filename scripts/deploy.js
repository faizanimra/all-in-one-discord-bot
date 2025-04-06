import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function deploy() {
    console.log('🚀 Starting deployment process...\n');

    try {
        // Run environment validation
        console.log('Running environment validation...');
        await import('./validate.js');

        // Create backup before deployment
        console.log('\nCreating backup before deployment...');
        await import('./backup.js');

        // Install dependencies
        console.log('\nInstalling dependencies...');
        await execAsync('npm install --production');

        // Build application (if needed)
        console.log('\nBuilding application...');
        await execAsync('npm run build');

        // Deploy commands
        console.log('\nDeploying slash commands...');
        await execAsync('npm run deploy');

        // Start the application
        console.log('\nStarting the application...');
        const pm2Config = {
            name: 'discord-bot',
            script: 'src/index.js',
            watch: false,
            env: {
                NODE_ENV: 'production'
            }
        };

        // Write PM2 config
        await fs.writeFile(
            join(__dirname, '..', 'ecosystem.config.json'),
            JSON.stringify(pm2Config, null, 2)
        );

        // Start with PM2
        await execAsync('pm2 start ecosystem.config.json');

        console.log('\n✅ Deployment completed successfully!');
        console.log('\nTo monitor the bot:');
        console.log('- View logs: pm2 logs discord-bot');
        console.log('- Monitor status: pm2 monit');
        console.log('- Stop bot: pm2 stop discord-bot');
        console.log('- Restart bot: pm2 restart discord-bot');

    } catch (error) {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    }
}

deploy();
