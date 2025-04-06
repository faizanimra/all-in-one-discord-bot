import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function backup() {
    console.log('📦 Starting database backup...');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.collections();
        
        // Create backup directory
        const backupDir = join(__dirname, '..', 'backups');
        await fs.mkdir(backupDir, { recursive: true });

        // Create timestamped directory for this backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = join(backupDir, timestamp);
        await fs.mkdir(backupPath);

        // Backup each collection
        for (const collection of collections) {
            const documents = await collection.find({}).toArray();
            const collectionName = collection.collectionName;
            
            await fs.writeFile(
                join(backupPath, `${collectionName}.json`),
                JSON.stringify(documents, null, 2)
            );

            console.log(`✅ Backed up collection: ${collectionName}`);
        }

        console.log('\n🎉 Backup completed successfully!');
        console.log(`📂 Backup location: ${backupPath}`);

    } catch (error) {
        console.error('❌ Error during backup:', error);
    } finally {
        await mongoose.disconnect();
    }
}

backup();
