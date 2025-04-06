import ReactionRole from '../../models/ReactionRole.js';

export default {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (user.bot) return;

        // Handle partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        try {
            const reactionRole = await ReactionRole.findOne({
                messageId: reaction.message.id,
                emoji: reaction.emoji.toString()
            });

            if (!reactionRole) return;

            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = await guild.roles.fetch(reactionRole.roleId);

            if (!role) {
                console.error(`Role ${reactionRole.roleId} not found`);
                return;
            }

            await member.roles.add(role);
        } catch (error) {
            console.error('Error handling reaction role add:', error);
        }
    }
};
