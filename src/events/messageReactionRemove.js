const { getReactionRoles } = require('../utils/roleManager');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user, client) {
    if (user.bot) return;
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        return;
      }
    }
    if (!reaction.message.guild) return;

    const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const roles = await getReactionRoles(reaction.message.id);

    const match = roles.find((r) => r.emoji === emoji || r.emoji === reaction.emoji.name);
    if (!match) return;

    const role = reaction.message.guild.roles.cache.get(match.role_id);
    if (!role) return;

    const member = reaction.message.guild.members.cache.get(user.id);
    if (!member) return;

    try {
      await member.roles.remove(role);
    } catch (e) {
      console.error('[messageReactionRemove] Failed to remove role:', e.message);
    }
  },
};
