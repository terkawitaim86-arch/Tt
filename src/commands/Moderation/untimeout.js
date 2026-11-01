const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'untimeout',
  description: 'Remove a timeout from a member.',
  category: 'Moderation',
  usage: 'untimeout <@member> [reason]',
  aliases: ['unmute'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const member = message.mentions.members.first();

    if (!member) {
      return message.reply(replyOptions(usageEmbed({
        command: 'untimeout',
        syntax: `${prefix}untimeout <@member> [reason]`,
        example: `${prefix}untimeout @Member Appeal accepted`,
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ModerateMembers,
      permissionLabel: 'Moderate Members',
      botPermissions: { 'Moderate Members': PermissionFlagsBits.ModerateMembers },
      target: member,
      actionName: 'untimeout',
      command: 'untimeout',
    });
    if (denied) return message.reply(replyOptions(denied));

    if (!member.isCommunicationDisabled || !member.isCommunicationDisabled()) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Not timed out',
        description: `<@${member.id}> is not currently timed out.`,
        footer: 'ZMB • untimeout',
      })));
    }

    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);

    try {
      await member.timeout(null, `${message.author.tag}: ${reason}`);
    } catch (error) {
      console.error(`[untimeout] Failed for ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Untimeout failed',
        description: describeDiscordError(error, 'I could not remove that timeout.'),
        footer: 'ZMB • untimeout',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'untimeout',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Timeout removed',
      description: `<@${member.id}> can talk again.`,
      footer: 'ZMB • untimeout',
      fields: [
        { name: 'Member', value: `\`${member.user.tag}\``, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
