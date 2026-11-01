const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { successEmbed, usageEmbed } = require('../../utils/embedUtils');
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
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply({
        embeds: [usageEmbed({
          command: 'ban',
          syntax: `${prefix}ban <@member> [reason]`,
          example: `${prefix}ban @Spammer Repeated advertising`,
        })],
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.BanMembers,
      permissionLabel: 'Ban Members',
      botPermissions: { 'Ban Members': PermissionFlagsBits.BanMembers },
      target: member,
      actionName: 'ban',
      command: 'ban',
    });
    if (denied) {
      return message.reply({ embeds: [denied], allowedMentions: { parse: [], repliedUser: false } });
    }

    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);

    try {
      await member.ban({ reason: `${message.author.tag}: ${reason}` });
    } catch (error) {
      console.error(`[ban] Failed to ban ${member.id}:`, error.message);
      return message.reply({
        embeds: [{
          ...successEmbed({ title: 'Ban failed', description: describeDiscordError(error, 'I could not ban that member.'), color: 0xef4444, footer: 'ZMB • ban' }).data,
        }],
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    await logAction({
      guildId: message.guild.id,
      action: 'ban',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply({
      embeds: [successEmbed({
        title: 'Member banned',
        description: `<@${member.id}> has been banned.`,
        footer: 'ZMB • ban',
        fields: [
          { name: 'Member', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
          { name: 'Moderator', value: `${message.author.tag}\n<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false },
        ],
      })],
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
