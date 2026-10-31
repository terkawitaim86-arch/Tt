const { EmbedBuilder, PermissionFlagsBits, ChannelType, PermissionOverwrites } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');

module.exports = {
  name: 'lock',
  description: 'Lock a channel so only moderators can send messages.',
  category: 'Moderation',
  usage: 'lock [channel] [reason]',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('You need the **Manage Channels** permission to use this command.');
    }

    const channel = message.mentions.channels.first() || message.channel;
    const reason = args.filter((a) => !a.startsWith('<#')).join(' ') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      });

      await logAction({
        guildId: message.guild.id,
        action: 'lock',
        targetId: channel.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🔒 Channel Locked')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[lock] Failed:', error);
      return message.reply('Failed to lock that channel. Please try again.');
    }
  },
};
