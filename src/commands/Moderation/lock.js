const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError, textChannelOnly } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');

module.exports = {
  name: 'lock',
  description: 'Lock a channel so members cannot send messages.',
  category: 'Moderation',
  usage: 'lock [channel] [reason]',
  aliases: ['lockchannel'],
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const reason = truncate(args.filter((a) => !a.startsWith('<#')).join(' ') || 'No reason provided', 900);

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ManageChannels,
      permissionLabel: 'Manage Channels',
      botPermissions: {
        'Manage Channels': PermissionFlagsBits.ManageChannels,
        'Manage Roles': PermissionFlagsBits.ManageRoles,
      },
      command: 'lock',
    });
    if (denied) return message.reply(replyOptions(denied));

    const channelProblem = textChannelOnly(channel);
    if (channelProblem) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Cannot lock that channel',
        description: channelProblem,
        footer: 'ZMB • lock',
      })));
    }

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      }, { reason: `Locked by ${message.author.tag}: ${reason}` });
    } catch (error) {
      console.error(`[lock] Failed to lock ${channel.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Lock failed',
        description: describeDiscordError(error, 'I could not lock that channel.'),
        footer: 'ZMB • lock',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'lock',
      targetId: channel.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Channel locked',
      description: `<#${channel.id}> is now locked.`,
      footer: 'ZMB • lock',
      fields: [
        { name: 'Channel', value: `\`#${channel.name ?? channel.id}\``, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
