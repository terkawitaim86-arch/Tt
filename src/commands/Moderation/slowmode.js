const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');

module.exports = {
  name: 'slowmode',
  description: 'Set the slowmode delay for a channel (0-21600 seconds).',
  category: 'Moderation',
  usage: 'slowmode <seconds> [channel]',
  aliases: ['slow'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('You need the **Manage Channels** permission to use this command.');
    }

    const seconds = parseInt(args[0], 10);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply('Usage: `slowmode <seconds> [channel]`\nThe delay must be between **0 and 21600** seconds.');
    }

    const channel = message.mentions.channels.first() || message.channel;

    try {
      await channel.setRateLimitPerUser(seconds);

      await logAction({
        guildId: message.guild.id,
        action: 'slowmode',
        targetId: channel.id,
        moderatorId: message.author.id,
        reason: `Set slowmode to ${seconds}s`,
        duration: seconds > 0 ? `${seconds}s` : 'off',
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🐢 Slowmode Updated')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Delay', value: seconds === 0 ? 'Off' : `${seconds} seconds`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[slowmode] Failed:', error);
      return message.reply('Failed to set slowmode. Please try again.');
    }
  },
};
