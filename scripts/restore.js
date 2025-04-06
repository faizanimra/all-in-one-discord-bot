import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function restore() {
    console.log('📦 Database Restore Utility\n');

    try {
        // Get backup directories
        const backupDir = join(__dirname, '..', 'backups');
        const backups = await fs.readdir(backupDir);

        if (backups.length === 0) {
            console.log('❌ No backups found');
            return;
        }

        // List available backups
        console.log('Available backups:');
        backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup}`);
        });

        // Get user selection
        const selection = await question('\nEnter backup number to restore: ');
        const selectedBackup = backups[parseInt(selection) - 1];

        if (!selectedBackup) {
            console.log('❌ Invalid selection');
            return;
        }

        // Confirm restore
        console.log(`\n⚠️ Warning: This will overwrite your current database with backup: ${selectedBackup}`);
        const confirm = await question('Are you sure you want to proceed? (y/N): ');

        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ Restore cancelled');
            return;
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get backup files
        const backupPath = join(backupDir, selectedBackup);
        const files = await fs.readdir(backupPath);

        // Restore each collection
        for (const file of files) {
            const collectionName = file.replace('.json', '');
            const data = JSON.parse(
                await fs.readFile(join(backupPath, file), 'utf8')
            );

            // Drop existing collection
            await mongoose.connection.db.dropCollection(collectionName)
                .catch(() => console.log(`Creating new collection: ${collectionName}`));

            // Insert backup data
            if (data.length > 0) {
                await mongoose.connection.db
                    .collection(collectionName)
                    .insertMany(data);
            }

            console.log(`✅ Restored collection: ${collectionName}`);
        }

        console.log('\n🎉 Restore completed successfully!');

    } catch (error) {
        console.error('❌ Error during restore:', error);
    } finally {
        rl.close();
        await mongoose.disconnect();
    }
}

restore();
