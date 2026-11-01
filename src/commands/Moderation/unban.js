const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'unban',
  description: 'Unban a user by their ID.',
  category: 'Moderation',
  usage: 'unban <user_id> [reason]',
  aliases: ['ub'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const userId = (args[0] || '').replace(/[<@!>]/g, '');

    if (!/^\d{15,20}$/.test(userId)) {
      return message.reply(replyOptions(usageEmbed({
        command: 'unban',
        syntax: `${prefix}unban <user_id> [reason]`,
        example: `${prefix}unban 123456789012345678 Appeal accepted`,
        description: 'Provide a valid user ID. Enable Developer Mode and right-click the profile to copy it.',
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.BanMembers,
      permissionLabel: 'Ban Members',
      botPermissions: { 'Ban Members': PermissionFlagsBits.BanMembers },
      command: 'unban',
    });
    if (denied) return message.reply(replyOptions(denied));

    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);

    let user;
    try {
      user = await message.guild.members.unban(userId, `${message.author.tag}: ${reason}`);
    } catch (error) {
      console.error(`[unban] Failed for ${userId}:`, error.message);
      const notBanned = error && error.code === 10026;
      return message.reply(replyOptions(errorEmbed({
        title: notBanned ? 'User is not banned' : 'Unban failed',
        description: notBanned
          ? `No banned user with ID \`${userId}\` was found.`
          : describeDiscordError(error, 'I could not unban that user.'),
        footer: 'ZMB • unban',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'unban',
      targetId: userId,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'User unbanned',
      description: `**${user ? user.tag : userId}** is no longer banned.`,
      footer: 'ZMB • unban',
      fields: [
        { name: 'User ID', value: `\`${userId}\``, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
