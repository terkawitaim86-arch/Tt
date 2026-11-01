const { PermissionFlagsBits } = require('discord.js');

/**
 * Verify a moderator may act on a target member.
 * Returns an error string, or null when the action is allowed.
 */
function checkHierarchy(message, target, verb = 'moderate') {
  if (target.id === message.author.id) return `You cannot ${verb} yourself.`;
  if (target.id === message.guild.ownerId) return `You cannot ${verb} the server owner.`;
  if (target.id === message.client.user.id) return `I cannot ${verb} myself.`;
  if (
    message.author.id !== message.guild.ownerId &&
    message.member.roles.highest.comparePositionTo(target.roles.highest) <= 0
  ) {
    return `You cannot ${verb} someone with an equal or higher role than yours.`;
  }
  return null;
}

module.exports = { checkHierarchy, PermissionFlagsBits };
