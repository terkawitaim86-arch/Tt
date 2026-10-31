const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');

module.exports = {
  name: 'unban',
  description: 'Unban a user by their ID.',
  category: 'Moderation',
  usage: 'unban <user_id> [reason]',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('You need the **Ban Members** permission to use this command.');
    }

    const userId = args[0];
    if (!userId || !/^\d+$/.test(userId)) {
      return message.reply('Usage: `unban <user_id> [reason]`\nYou can find a user\'s ID by enabling Developer Mode and right-clicking their profile.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await message.guild.bans.remove(userId, `${message.author.tag}: ${reason}`);
      await logAction({
        guildId: message.guild.id,
        action: 'unban',
        targetId: userId,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🔓 User Unbanned')
        .addFields(
          { name: 'User ID', value: userId, inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[unban] Failed:', error);
      if (error.code === 10026) {
        return message.reply('That user is not banned.');
      }
      return message.reply('Failed to unban that user. Please try again.');
    }
  },
};
