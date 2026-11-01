const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getSettings } = require('../../utils/guildSettings');
const { getJailRecord, createJailRecord } = require('../../utils/jailManager');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'jail',
  description: 'Send a member to jail by removing their roles and assigning the jail role.',
  category: 'Moderation',
  usage: 'jail <@member> [reason]',
  aliases: ['isolated', 'muteold'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const settings = await getSettings(message.guild.id);

    if (!settings.jail_role_id) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Jail role not configured',
        description: `Set a jail role first with \`${prefix}setjailrole <@role>\`.`,
        footer: 'ZMB • jail',
      })));
    }

    const jailRole = message.guild.roles.cache.get(settings.jail_role_id);
    if (!jailRole) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Jail role missing',
        description: 'The configured jail role no longer exists. Set a new one with `setjailrole`.',
        footer: 'ZMB • jail',
      })));
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply(replyOptions(usageEmbed({
        command: 'jail',
        syntax: `${prefix}jail <@member> [reason]`,
        example: `${prefix}jail @Member Cool down`,
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ModerateMembers,
      permissionLabel: 'Moderate Members',
      botPermissions: { 'Manage Roles': PermissionFlagsBits.ManageRoles },
      target: member,
      actionName: 'jail',
      command: 'jail',
    });
    if (denied) return message.reply(replyOptions(denied));

    const botHighest = message.guild.members.me.roles.highest.position;
    if (jailRole.position >= botHighest) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Role hierarchy',
        description: `The jail role **${jailRole.name}** is higher than or equal to my highest role, so I cannot assign it. Move my role above it.`,
        footer: 'ZMB • jail',
      })));
    }

    const existing = await getJailRecord(message.guild.id, member.id);
    if (existing) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Already jailed',
        description: `<@${member.id}> is already in jail.`,
        footer: 'ZMB • jail',
      })));
    }

    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);
    const previousRoles = member.roles.cache
      .filter((role) => role.id !== message.guild.id && role.position < botHighest)
      .map((role) => role.id);

    try {
      if (previousRoles.length > 0) {
        await member.roles.remove(previousRoles, `Jailed by ${message.author.tag}: ${reason}`);
      }
      await member.roles.add(jailRole, `Jailed by ${message.author.tag}: ${reason}`);
    } catch (error) {
      console.error(`[jail] Failed to move ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Jail failed',
        description: describeDiscordError(error, 'I could not move that member to jail. Their roles may be unchanged.'),
        footer: 'ZMB • jail',
      })));
    }

    if (settings.jail_channel_id) {
      const jailChannel = message.guild.channels.cache.get(settings.jail_channel_id);
      if (jailChannel) {
        await jailChannel
          .send({ content: `<@${member.id}>, you have been placed in jail. Reason: ${reason}`, allowedMentions: { users: [member.id] } })
          .catch((error) => console.error('[jail] Failed to notify jail channel:', error.message));
      }
    }

    await createJailRecord(message.guild.id, member.id, previousRoles, message.author.id, reason);
    await logAction({
      guildId: message.guild.id,
      action: 'jail',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Member jailed',
      description: `<@${member.id}> has been placed in jail.`,
      footer: 'ZMB • jail',
      fields: [
        { name: 'Member', value: `\`${member.id}\``, inline: true },
        { name: 'Roles removed', value: `${previousRoles.length}`, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
