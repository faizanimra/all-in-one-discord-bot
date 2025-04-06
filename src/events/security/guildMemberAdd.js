import { Collection } from 'discord.js';
import Guild from '../../models/Guild.js';

const joinedMembers = new Collection();

export default {
    name: 'guildMemberAdd',
    async execute(member) {
        const guildSettings = await Guild.findOne({ guildId: member.guild.id });
        if (!guildSettings?.security.antiRaid) return;

        const now = Date.now();
        const timeWindow = guildSettings.security.raidTimeWindow || 10000; // 10 seconds default
        const raidThreshold = guildSettings.security.raidThreshold || 10;

        // Clean up old entries
        joinedMembers.sweep(timestamp => timestamp <= now - timeWindow);

        // Add new member
        joinedMembers.set(member.id, now);

        // Check if raid threshold is exceeded
        if (joinedMembers.size >= raidThreshold) {
            try {
                // Enable server lockdown
                const channels = await member.guild.channels.fetch();
                channels.forEach(async channel => {
                    if (channel.isTextBased()) {
                        await channel.permissionOverwrites.edit(member.guild.roles.everyone, {
                            SendMessages: false
                        });
                    }
                });

                // Kick recently joined members
                const recentMembers = Array.from(joinedMembers.keys());
                for (const memberId of recentMembers) {
                    const targetMember = await member.guild.members.fetch(memberId).catch(() => null);
                    if (targetMember) {
                        await targetMember.kick('Anti-raid protection');
                    }
                }

                // Clear the collection
                joinedMembers.clear();

                // Log the raid attempt
                const logChannel = member.guild.channels.cache.get(guildSettings.settings.modLogChannel);
                if (logChannel) {
                    await logChannel.send({
                        embeds: [{
                            title: '🚨 RAID DETECTED',
                            description: 'Anti-raid measures have been activated',
                            fields: [
                                { name: 'Members Kicked', value: recentMembers.length.toString() },
                                { name: 'Time Window', value: `${timeWindow / 1000} seconds` }
                            ],
                            color: 0xFF0000,
                            timestamp: new Date()
                        }]
                    });

                    // Notify administrators
                    await logChannel.send({
                        content: '@here A raid has been detected and blocked. Please review the situation.'
                    });
                }

                // Create a public notification
                const systemChannel = member.guild.systemChannel;
                if (systemChannel) {
                    await systemChannel.send({
                        embeds: [{
                            title: '🚨 Security Alert',
                            description: 'A raid attempt has been detected and blocked. The server is temporarily in lockdown mode. Normal operations will resume shortly.',
                            color: 0xFF0000
                        }]
                    });
                }

                // Set up automatic unlock after 5 minutes
                setTimeout(async () => {
                    channels.forEach(async channel => {
                        if (channel.isTextBased()) {
                            await channel.permissionOverwrites.edit(member.guild.roles.everyone, {
                                SendMessages: null
                            });
                        }
                    });

                    if (systemChannel) {
                        await systemChannel.send({
                            embeds: [{
                                title: '✅ Security Update',
                                description: 'The server lockdown has been lifted. Normal operations have resumed.',
                                color: 0x00FF00
                            }]
                        });
                    }
                }, 300000); // 5 minutes
            } catch (error) {
                console.error('Error in anti-raid system:', error);
            }
        }

        // Auto-role assignment (if configured)
        if (guildSettings.settings.autoRole) {
            try {
                const role = await member.guild.roles.fetch(guildSettings.settings.autoRole);
                if (role) {
                    await member.roles.add(role);
                }
            } catch (error) {
                console.error('Error assigning auto-role:', error);
            }
        }
    }
};
