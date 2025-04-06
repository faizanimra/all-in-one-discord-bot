import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

describe('Integration Tests', () => {
    let client;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI);

        // Initialize Discord client
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates
            ]
        });

        await client.login(process.env.BOT_TOKEN);
    });

    afterAll(async () => {
        // Cleanup
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        await client.destroy();
    });

    describe('XP System Integration', () => {
        it('should handle message XP correctly', async () => {
            const { handleMessageXP } = await import('../src/handlers/xpHandler.js');
            const message = {
                author: { id: '123' },
                guild: { id: '456' },
                member: { id: '123' }
            };

            await expect(handleMessageXP(message)).resolves.not.toThrow();
        });

        it('should handle voice XP correctly', async () => {
            const { handleVoiceStateUpdate } = await import('../src/handlers/xpHandler.js');
            const oldState = {
                member: { id: '123' },
                guild: { id: '456' },
                channelId: null
            };
            const newState = {
                member: { id: '123' },
                guild: { id: '456' },
                channelId: '789'
            };

            await expect(handleVoiceStateUpdate(oldState, newState)).resolves.not.toThrow();
        });
    });

    describe('AutoMod Integration', () => {
        it('should handle spam detection correctly', async () => {
            const { checkAntiSpam } = await import('../src/utils/security.js');
            const messages = Array(5).fill({
                author: { id: '123' },
                guild: { id: '456' },
                content: 'test message',
                createdTimestamp: Date.now()
            });

            for (const message of messages) {
                await expect(checkAntiSpam(message)).resolves.not.toThrow();
            }
        });

        it('should handle bad words correctly', async () => {
            const { checkBadWords } = await import('../src/utils/security.js');
            const message = {
                content: 'test message',
                guild: { id: '456' },
                author: { id: '123' }
            };

            await expect(checkBadWords(message)).resolves.not.toThrow();
        });
    });

    describe('Stats Integration', () => {
        it('should track message stats correctly', async () => {
            const { updateMessageStats } = await import('../src/handlers/statsHandler.js');
            const message = {
                guild: { id: '456' },
                channel: { id: '789' }
            };

            await expect(updateMessageStats(message)).resolves.not.toThrow();
        });

        it('should track voice stats correctly', async () => {
            const { updateVoiceStats } = await import('../src/handlers/statsHandler.js');
            const oldState = {
                member: { id: '123' },
                guild: { id: '456' },
                channelId: null
            };
            const newState = {
                member: { id: '123' },
                guild: { id: '456' },
                channelId: '789'
            };

            await expect(updateVoiceStats(oldState, newState)).resolves.not.toThrow();
        });
    });

    describe('Reaction Roles Integration', () => {
        it('should handle role assignment correctly', async () => {
            const { handleReactionAdd } = await import('../src/handlers/reactionHandler.js');
            const reaction = {
                message: { id: '123', guild: { id: '456' } },
                emoji: { name: '✅' }
            };
            const user = { id: '789' };

            await expect(handleReactionAdd(reaction, user)).resolves.not.toThrow();
        });
    });
});
