const { PermissionFlagsBits } = require('discord.js');
const { addWarning, logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const { errorEmbed, usageEmbed, modEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'warn',
  description: 'Warn a member.',
  category: 'Moderation',
  usage: 'warn <@member> [reason]',
  aliases: ['w'],
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ embeds: [errorEmbed({ description: 'You need the **Moderate Members** permission.' })] });
    }
    const member = message.mentions.members.first();
    if (!member) {
      const prefix = await getPrefix(message.guild.id);
      return message.reply({
        embeds: [usageEmbed({ command: 'warn', syntax: `${prefix}warn <@member> [reason]`, example: `${prefix}w @user Be respectful` })],
      });
    }
    if (member.id === message.author.id) {
      return message.reply({ embeds: [errorEmbed({ description: 'You cannot warn yourself.' })] });
    }
    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
      const warningId = await addWarning({
        guildId: message.guild.id,
        userId: member.id,
        moderatorId: message.author.id,
        reason,
      });
      await logAction({ guildId: message.guild.id, action: 'warn', targetId: member.id, moderatorId: message.author.id, reason });
      return message.reply({
        embeds: [
          modEmbed({
            title: 'Member Warned',
            description: `<@${member.id}> has been warned.`,
            color: 0xfee75c,
            thumbnail: member.user.displayAvatarURL({ size: 256 }),
            fields: [
              { name: 'Member', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
              { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
              { name: 'Reason', value: reason, inline: false },
            ],
            footer: warningId ? `ZMB OFFICIAL â¢ Warning ID: ${String(warningId).slice(0, 8)}` : 'ZMB OFFICIAL â¢ Moderation',
          }),
        ],
      });
    } catch (error) {
      console.error('[warn]', error);
      return message.reply({ embeds: [errorEmbed({ description: 'Failed to warn that member.' })] });
    }
  },
};
