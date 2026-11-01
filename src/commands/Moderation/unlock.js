const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError, textChannelOnly } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');

module.exports = {
  name: 'unlock',
  description: 'Unlock a previously locked channel.',
  category: 'Moderation',
  usage: 'unlock [channel] [reason]',
  aliases: ['unlockchannel'],
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
      command: 'unlock',
    });
    if (denied) return message.reply(replyOptions(denied));

    const channelProblem = textChannelOnly(channel);
    if (channelProblem) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Cannot unlock that channel',
        description: channelProblem,
        footer: 'ZMB • unlock',
      })));
    }

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null,
        AddReactions: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
      }, { reason: `Unlocked by ${message.author.tag}: ${reason}` });
    } catch (error) {
      console.error(`[unlock] Failed to unlock ${channel.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Unlock failed',
        description: describeDiscordError(error, 'I could not unlock that channel.'),
        footer: 'ZMB • unlock',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'unlock',
      targetId: channel.id,
      moderatorId: message.author.id,
      reason,
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Channel unlocked',
      description: `<#${channel.id}> is no longer locked.`,
      footer: 'ZMB • unlock',
      fields: [
        { name: 'Channel', value: `\`#${channel.name ?? channel.id}\``, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
