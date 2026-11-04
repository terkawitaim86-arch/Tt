const { PermissionFlagsBits } = require('discord.js');

function hasPermission(member, flag) {
  return member.permissions.has(flag);
}

function canModerate(moderator, target, action) {
  if (!target) return { allowed: false, reason: 'Member not found.' };
  if (target.id === moderator.id) {
    return { allowed: false, reason: 'You cannot perform this action on yourself.' };
  }
  if (target.id === target.guild.ownerId) {
    return { allowed: false, reason: 'You cannot perform this action on the server owner.' };
  }
  if (target.roles.highest.position >= moderator.roles.highest.position) {
    return { allowed: false, reason: `You cannot ${action} a member with an equal or higher role than you.` };
  }
  return { allowed: true };
}

function botCanModerate(botMember, target, action) {
  if (!target) return { allowed: false, reason: 'Member not found.' };
  if (target.id === target.guild.ownerId) {
    return { allowed: false, reason: `I cannot ${action} the server owner.` };
  }
  if (target.roles.highest.position >= botMember.roles.highest.position) {
    return { allowed: false, reason: `I cannot ${action} a member with an equal or higher role than me.` };
  }
  return { allowed: true };
}

function permName(flag) {
  const names = {};
  names[PermissionFlagsBits.BanMembers] = 'Ban Members';
  names[PermissionFlagsBits.KickMembers] = 'Kick Members';
  names[PermissionFlagsBits.ModerateMembers] = 'Moderate Members';
  names[PermissionFlagsBits.ManageMessages] = 'Manage Messages';
  names[PermissionFlagsBits.ManageChannels] = 'Manage Channels';
  names[PermissionFlagsBits.ManageRoles] = 'Manage Roles';
  names[PermissionFlagsBits.ManageGuild] = 'Manage Server';
  names[PermissionFlagsBits.Administrator] = 'Administrator';
  return names[flag] || 'Required Permission';
}

module.exports = { hasPermission, canModerate, botCanModerate, permName };
