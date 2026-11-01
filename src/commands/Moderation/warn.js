const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { addWarning, logAction } = require('../../utils/modLog');

module.exports = {
  name: 'warn',
  description: 'Warn a member. Warnings are stored and can be viewed with ,warnings.',
  category: 'Moderation',
  usage: 'warn <@member> [reason]',
  aliases: ['w'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You need the **Moderate Members** permission to use this command.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Usage: `warn <@member> [reason]`');
    }

    if (member.id === message.author.id) {
      return message.reply('You cannot warn yourself.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const warningId = await addWarning({
        guildId: message.guild.id,
        userId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      await logAction({
        guildId: message.guild.id,
        action: 'warn',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('⚠️ Member Warned')
        .addFields(
          { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      if (warningId) {
        embed.setFooter({ text: `Warning ID: ${warningId.slice(0, 8)}` });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[warn] Failed:', error);
      return message.reply('Failed to warn that member. Please try again.');
    }
  },
};
