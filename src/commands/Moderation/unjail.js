const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getSettings } = require('../../utils/guildSettings');
const { getJailRecord, releaseJailRecord } = require('../../utils/jailManager');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'unjail',
  description: 'Release a member from jail and restore their previous roles.',
  category: 'Moderation',
  usage: 'unjail <@member> [reason]',
  aliases: ['release'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const member = message.mentions.members.first();

    if (!member) {
      return message.reply(replyOptions(usageEmbed({
        command: 'unjail',
        syntax: `${prefix}unjail <@member> [reason]`,
        example: `${prefix}unjail @Member Sentence served`,
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ModerateMembers,
      permissionLabel: 'Moderate Members',
      botPermissions: { 'Manage Roles': PermissionFlagsBits.ManageRoles },
      target: member,
      actionName: 'unjail',
      command: 'unjail',
    });
    if (denied) return message.reply(replyOptions(denied));

    let record;
    try {
      record = await getJailRecord(message.guild.id, member.id);
    } catch (error) {
      console.error(`[unjail] Failed to read jail record for ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Unjail failed',
        description: 'I could not read the jail record from the database. Please try again.',
        footer: 'ZMB • unjail',
      })));
    }

    if (!record) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Not jailed',
        description: `<@${member.id}> is not in the jail records.`,
        footer: 'ZMB • unjail',
      })));
    }

    const settings = await getSettings(message.guild.id);
    const jailRole = settings.jail_role_id ? message.guild.roles.cache.get(settings.jail_role_id) : null;
    const botHighest = message.guild.members.me.roles.highest.position;
    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);

    const rolesToAdd = (record.previous_roles || []).filter((roleId) => {
      const role = message.guild.roles.cache.get(roleId);
      return Boolean(role) && !role.managed && role.position < botHighest;
    });

    try {
      if (jailRole && member.roles.cache.has(jailRole.id)) {
        await member.roles.remove(jailRole, `Unjailed by ${message.author.tag}: ${reason}`);
      }
      if (rolesToAdd.length > 0) {
        await member.roles.add(rolesToAdd, `Unjailed by ${message.author.tag}: ${reason}`);
      }
    } catch (error) {
      console.error(`[unjail] Failed to restore ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Unjail failed',
        description: describeDiscordError(error, 'I could not restore that member\'s roles. The jail record was left active so you can retry.'),
        footer: 'ZMB • unjail',
      })));
    }

    const released = await releaseJailRecord(message.guild.id, member.id);
    if (!released) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Roles restored, record not closed',
        description: `<@${member.id}> got their roles back, but the jail record could not be marked as released. Try \`${prefix}unjail\` again.`,
        footer: 'ZMB • unjail',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'unjail',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Member released',
      description: `<@${member.id}> has been released from jail.`,
      footer: 'ZMB • unjail',
      fields: [
        { name: 'Member', value: `\`${member.id}\``, inline: true },
        { name: 'Roles restored', value: `${rolesToAdd.length}`, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
