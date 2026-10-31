const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');

module.exports = {
  name: 'untimeout',
  description: 'Remove a timeout from a member.',
  category: 'Moderation',
  usage: 'untimeout <@member> [reason]',
  aliases: ['unmute'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You need the **Moderate Members** (Timeout) permission to use this command.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Usage: `untimeout <@member> [reason]`');
    }

    if (!member.isCommunicationDisabled()) {
      return message.reply('That member is not currently timed out.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.timeout(null, `${message.author.tag}: ${reason}`);
      await logAction({
        guildId: message.guild.id,
        action: 'untimeout',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🔊 Timeout Removed')
        .addFields(
          { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[untimeout] Failed:', error);
      return message.reply('Failed to remove the timeout. Please try again.');
    }
  },
};
