const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const { successEmbed, errorEmbed, usageEmbed, modEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server.',
  category: 'Moderation',
  usage: 'ban <@member> [reason]',
  aliases: ['b'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Ban Members** permission to use this command.',
          }),
        ],
      });
    }

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'I cannot ban',
            description: 'I need the **Ban Members** permission.',
          }),
        ],
      });
    }

    const member = message.mentions.members.first();
    if (!member) {
      const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
      return message.reply({
        embeds: [
          usageEmbed({
            command: 'ban',
            syntax: `${prefix}ban <@member> [reason]`,
            example: `${prefix}b @user Breaking rules`,
            description: 'Ban a member from the server. Alias: `b`',
          }),
        ],
      });
    }

    if (member.id === message.author.id) {
      return message.reply({
        embeds: [errorEmbed({ description: 'You cannot ban yourself.' })],
      });
    }

    if (member.id === client.user.id) {
      return message.reply({
        embeds: [errorEmbed({ description: 'I cannot ban myself.' })],
      });
    }

    if (!member.bannable) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'I cannot ban that member â they may have a higher role than me.',
          }),
        ],
      });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.ban({ reason: `${message.author.tag}: ${reason}` });
      await logAction({
        guildId: message.guild.id,
        action: 'ban',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      return message.reply({
        embeds: [
          modEmbed({
            title: 'Member Banned',
            description: `<@${member.id}> has been banned from the server.`,
            color: 0xed4245,
            thumbnail: member.user.displayAvatarURL({ size: 256 }),
            fields: [
              { name: 'Member', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
              { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
              { name: 'Reason', value: reason, inline: false },
            ],
            footer: 'ZMB OFFICIAL â¢ Moderation',
          }),
        ],
      });
    } catch (error) {
      console.error('[ban] Failed:', error);
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'Failed to ban that member. Please try again.',
          }),
        ],
      });
    }
  },
};

