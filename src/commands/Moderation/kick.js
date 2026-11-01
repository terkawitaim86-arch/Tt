const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'kick',
  description: 'Kick a member from the server.',
  category: 'Moderation',
  usage: 'kick <@member> [reason]',
  aliases: ['k'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const member = message.mentions.members.first();

    if (!member) {
      return message.reply(replyOptions(usageEmbed({
        command: 'kick',
        syntax: `${prefix}kick <@member> [reason]`,
        example: `${prefix}kick @Member Breaking rules`,
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.KickMembers,
      permissionLabel: 'Kick Members',
      botPermissions: { 'Kick Members': PermissionFlagsBits.KickMembers },
      target: member,
      actionName: 'kick',
      command: 'kick',
    });
    if (denied) return message.reply(replyOptions(denied));

    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);

    try {
      await member.kick(`${message.author.tag}: ${reason}`);
    } catch (error) {
      console.error(`[kick] Failed to kick ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Kick failed',
        description: describeDiscordError(error, 'I could not kick that member.'),
        footer: 'ZMB • kick',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'kick',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Member kicked',
      description: `<@${member.id}> has been kicked from the server.`,
      footer: 'ZMB • kick',
      fields: [
        { name: 'Member', value: `\`${member.id}\``, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
