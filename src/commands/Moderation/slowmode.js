const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError, textChannelOnly } = require('../../utils/permissions');
const { formatDuration } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

const MAX_SLOWMODE = 21600;

module.exports = {
  name: 'slowmode',
  description: 'Set the slowmode delay for a channel (0-21600 seconds).',
  category: 'Moderation',
  usage: 'slowmode <seconds> [channel]',
  aliases: ['slow'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const raw = args[0];

    const invalid = () => message.reply(replyOptions(usageEmbed({
      command: 'slowmode',
      syntax: `${prefix}slowmode <0-21600> [channel]`,
      example: `${prefix}slowmode 10 #general`,
      description: 'The delay must be a whole number between **0** and **21600** seconds (6 hours). Use `0` to turn slowmode off.',
    })));

    if (!/^\d+$/.test(String(raw ?? ''))) return invalid();

    const seconds = Number.parseInt(raw, 10);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_SLOWMODE) return invalid();

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ManageChannels,
      permissionLabel: 'Manage Channels',
      botPermissions: { 'Manage Channels': PermissionFlagsBits.ManageChannels },
      command: 'slowmode',
    });
    if (denied) return message.reply(replyOptions(denied));

    const channel = message.mentions.channels.first() || message.channel;
    const channelProblem = textChannelOnly(channel);
    if (channelProblem) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Cannot set slowmode here',
        description: channelProblem,
        footer: 'ZMB • slowmode',
      })));
    }

    try {
      await channel.setRateLimitPerUser(seconds, `Slowmode set by ${message.author.tag}`);
    } catch (error) {
      console.error(`[slowmode] Failed to update ${channel.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Slowmode failed',
        description: describeDiscordError(error, 'I could not update slowmode for that channel.'),
        footer: 'ZMB • slowmode',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'slowmode',
      targetId: channel.id,
      moderatorId: message.author.id,
      reason: `Set slowmode to ${seconds}s`,
      duration: seconds > 0 ? `${seconds}s` : 'off',
    });

    return message.reply(replyOptions(successEmbed({
      title: 'Slowmode updated',
      description: seconds === 0
        ? `<#${channel.id}> now has slowmode **disabled**.`
        : `<#${channel.id}> now has a **${formatDuration(seconds)}** slowmode (${seconds} seconds).`,
      footer: 'ZMB • slowmode',
      fields: [
        { name: 'Channel', value: `\`#${channel.name ?? channel.id}\``, inline: true },
        { name: 'Delay', value: seconds === 0 ? 'Off' : `${formatDuration(seconds)}`, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
      ],
    })));
  },
};
