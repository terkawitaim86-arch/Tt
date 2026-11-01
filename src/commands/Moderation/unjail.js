const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getSettings } = require('../../utils/guildSettings');
const { releaseJailRecord } = require('../../utils/jailManager');
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

    const settings = await getSettings(message.guild.id);
    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);
    const botHighest = message.guild.members.me.roles.highest.position;

    let record;
    try {
      record = await releaseJailRecord(message.guild.id, member.id);
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

    const jailRole = settings.jail_role_id ? message.guild.roles.cache.get(settings.jail_role_id) : null;

    try {
      if (jailRole && member.roles.cache.has(jailRole.id)) {
        await member.roles.remove(jailRole, `Unjailed by ${message.author.tag}: ${reason}`);
      }

      const rolesToAdd = (record.previous_roles || []).filter((roleId) => {
        const role = message.guild.roles.cache.get(roleId);
        return Boolean(role) && role.position < botHighest;
      });

      if (rolesToAdd.length > 0) {
        await member.roles.add(rolesToAdd, `Unjailed by ${message.author.tag}: ${reason}`);
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
    } catch (error) {
      console.error(`[unjail] Failed to restore ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Unjail failed',
        description: describeDiscordError(error, 'I could not restore that member\'s roles. Re-add them manually if needed.'),
        footer: 'ZMB • unjail',
      })));
    }
  },
};
