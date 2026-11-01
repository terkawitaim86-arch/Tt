const { PermissionFlagsBits } = require('discord.js');
const { errorEmbed } = require('./embedUtils');

/**
 * Shared permission / hierarchy helpers.
 *
 * All moderation commands funnel their authorization through this module so the
 * rules are identical everywhere and cannot drift apart.
 */

function hasPermission(source, flag) {
  if (!source || !source.permissions) return false;
  const perms = source.permissions;
  try {
    if (typeof perms.has === 'function') return Boolean(perms.has(flag));
    return Boolean(perms[flag]);
  } catch {
    return false;
  }
}

function highestRolePosition(member) {
  const highest = member && member.roles && member.roles.highest;
  return highest && typeof highest.position === 'number' ? highest.position : 0;
}

function isGuildOwner(guild, userId) {
  return Boolean(guild && userId && guild.ownerId === userId);
}

function isAdministrator(member) {
  return hasPermission(member, PermissionFlagsBits.Administrator);
}

/** Human readable list of missing bot permissions. */
function missingBotPermissions(guild, flags) {
  const me = guild && guild.members ? guild.members.me : null;
  const missing = [];
  for (const [name, flag] of Object.entries(flags)) {
    if (!hasPermission(me, flag)) missing.push(name);
  }
  return missing;
}

function textChannelOnly(channel) {
  if (!channel) return 'I could not resolve that channel.';
  const type = channel.type;
  const textLike = [0, 5, 10, 11, 12, 13, 15];
  if (typeof type === 'number' && !textLike.includes(type)) {
    return 'That channel does not support text messages.';
  }
  return null;
}

/**
 * Validate that `target` may be actioned by `moderator` and by the bot itself.
 * Returns an error string, or null when the action is allowed.
 */
function hierarchyProblem({ guild, moderator, target, actionName = 'act on' }) {
  if (!target) return null;

  if (target.id === (moderator && moderator.id)) {
    return `You cannot ${actionName} yourself.`;
  }

  if (isGuildOwner(guild, target.id)) {
    return `You cannot ${actionName} the server owner.`;
  }

  const me = guild && guild.members ? guild.members.me : null;

  if (me && target.id === me.id) {
    return `I cannot ${actionName} myself.`;
  }

  const moderatorPosition = highestRolePosition(moderator);
  const targetPosition = highestRolePosition(target);

  const moderatorExempt = isGuildOwner(guild, moderator && moderator.id) || isAdministrator(moderator);

  if (!moderatorExempt && moderatorPosition <= targetPosition) {
    return `You cannot ${actionName} **${target.user ? target.user.tag : target.id}** because their highest role is equal to or above yours.`;
  }

  if (me && highestRolePosition(me) <= targetPosition) {
    return `I cannot ${actionName} **${target.user ? target.user.tag : target.id}** because their highest role is equal to or above mine. Move my role higher in the role list.`;
  }

  return null;
}

/**
 * Build a resolved embed for a failed privilege check, or null when allowed.
 *
 * @param {object} message  discord.js message
 * @param {object} options  { permission, permissionLabel, botPermissions, target, actionName, command }
 */
function guardModeration(message, options = {}) {
  const {
    permission,
    permissionLabel,
    botPermissions = {},
    target = null,
    actionName = 'act on',
    command,
  } = options;

  const guild = message.guild;

  if (!guild) {
    return errorEmbed({ title: 'Server only', description: 'This command can only be used inside a server.' });
  }

  if (permission && !hasPermission(message.member, permission)) {
    return errorEmbed({
      title: 'Missing permission',
      description: `You need the **${permissionLabel || permission}** permission to use this command.`,
      footer: command ? `ZMB • ${command}` : undefined,
    });
  }

  const missing = missingBotPermissions(guild, botPermissions);
  if (missing.length > 0) {
    return errorEmbed({
      title: 'I am missing permissions',
      description: `I need the following permission(s): **${missing.join(', ')}**.`,
      footer: command ? `ZMB • ${command}` : undefined,
    });
  }

  if (target) {
    const problem = hierarchyProblem({ guild, moderator: message.member, target, actionName });
    if (problem) {
      return errorEmbed({
        title: 'Role hierarchy',
        description: problem,
        footer: command ? `ZMB • ${command}` : undefined,
      });
    }
  }

  return null;
}

/** True when the bot may DM this member. */
function canDirectMessage(member) {
  try {
    return Boolean(member && typeof member.send === 'function');
  } catch {
    return false;
  }
}

/** Convert a discord.js API error into a safe, user-facing sentence. */
function describeDiscordError(error, fallback = 'The action could not be completed.') {
  const code = error && error.code;
  switch (code) {
    case 50013:
      return 'Discord rejected the action: I am missing the required permissions.';
    case 50034:
      return 'Discord rejected the action: bulk deletion only works on messages from the last 14 days.';
    case 50035:
      return 'Discord rejected the action: one of the supplied values is invalid.';
    case 50001:
      return 'Discord rejected the action: I do not have access to that channel.';
    case 10007:
      return 'Discord rejected the action: that member could not be found.';
    case 10003:
      return 'Discord rejected the action: that channel could not be found.';
    case 10013:
      return 'Discord rejected the action: that user could not be found.';
    default:
      return fallback;
  }
}

module.exports = {
  hasPermission,
  highestRolePosition,
  isGuildOwner,
  isAdministrator,
  missingBotPermissions,
  textChannelOnly,
  hierarchyProblem,
  guardModeration,
  canDirectMessage,
  describeDiscordError,
};
