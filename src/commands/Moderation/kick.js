const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const { errorEmbed, usageEmbed, modEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'kick',
  description: 'Kick a member from the server.',
  category: 'Moderation',
  usage: 'kick <@member> [reason]',
  aliases: ['k'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({ embeds: [errorEmbed({ description: 'You need the **Kick Members** permission.' })] });
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({ embeds: [errorEmbed({ description: 'I need the **Kick Members** permission.' })] });
    }

    const member = message.mentions.members.first();
    if (!member) {
      const prefix = await getPrefix(message.guild.id);
      return message.reply({
        embeds: [usageEmbed({ command: 'kick', syntax: `${prefix}kick <@member> [reason]`, example: `${prefix}k @user Spam` })],
      });
    }
    if (member.id === message.author.id) {
      return message.reply({ embeds: [errorEmbed({ description: 'You cannot kick yourself.' })] });
    }
    if (!member.kickable) {
      return message.reply({ embeds: [errorEmbed({ description: 'I cannot kick that member â they may have a higher role than me.' })] });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
      await member.kick(`${message.author.tag}: ${reason}`);
      await logAction({ guildId: message.guild.id, action: 'kick', targetId: member.id, moderatorId: message.author.id, reason });
      return message.reply({
        embeds: [
          modEmbed({
            title: 'Member Kicked',
            description: `<@${member.id}> has been kicked.`,
            color: 0xed4245,
            thumbnail: member.user.displayAvatarURL({ size: 256 }),
            fields: [
              { name: 'Member', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
              { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
              { name: 'Reason', value: reason, inline: false },
            ],
          }),
        ],
      });
    } catch (error) {
      console.error('[kick]', error);
      return message.reply({ embeds: [errorEmbed({ description: 'Failed to kick that member.' })] });
    }
  },
};