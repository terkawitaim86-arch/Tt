const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server.',
  category: 'Moderation',
  usage: 'ban <@member> [reason]',
  aliases: ['b'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const member = message.mentions.members.first();

    if (!member) {
      return message.reply(replyOptions(usageEmbed({
        command: 'ban',
        syntax: `${prefix}ban <@member> [reason]`,
        example: `${prefix}ban @Spammer Repeated advertising`,
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.BanMembers,
      permissionLabel: 'Ban Members',
      botPermissions: { 'Ban Members': PermissionFlagsBits.BanMembers },
      target: member,
      actionName: 'ban',
      command: 'ban',
    });
    if (denied) return message.reply(replyOptions(denied));

    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);

    try {
      await member.ban({ reason: `${message.author.tag}: ${reason}` });
    } catch (error) {
      console.error(`[ban] Failed to ban ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Ban failed',
        description: describeDiscordError(error, 'I could not ban that member.'),
        footer: 'ZMB • ban',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'ban',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Member banned',
      description: `<@${member.id}> has been banned from the server.`,
      footer: 'ZMB • ban',
      fields: [
        { name: 'Member', value: `\`${member.id}\``, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
