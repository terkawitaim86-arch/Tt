const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { formatNumber } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

module.exports = {
  name: 'clear',
  description: 'Delete recent messages from the channel (1-100).',
  category: 'Moderation',
  usage: 'clear <amount> [@member]',
  aliases: ['purge', 'c'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const raw = args[0];
    const amount = Number.parseInt(raw, 10);

    const usage = () => message.reply(replyOptions(usageEmbed({
      command: 'clear',
      syntax: `${prefix}clear <1-100> [@member]`,
      example: `${prefix}clear 25 @Member`,
    })));

    if (!/^\d+$/.test(String(raw ?? '')) || !Number.isFinite(amount) || amount < 1 || amount > 100) {
      return usage();
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ManageMessages,
      permissionLabel: 'Manage Messages',
      botPermissions: {
        'Manage Messages': PermissionFlagsBits.ManageMessages,
        'Read Message History': PermissionFlagsBits.ReadMessageHistory,
      },
      command: 'clear',
    });
    if (denied) return message.reply(replyOptions(denied));

    const target = message.mentions.members.first() || null;
    const channel = message.channel;

    let fetched;
    try {
      fetched = await channel.messages.fetch({ limit: amount });
    } catch (error) {
      console.error(`[clear] Failed to fetch messages in ${channel.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Could not read messages',
        description: describeDiscordError(error, 'I could not read the messages in this channel.'),
        footer: 'ZMB • clear',
      })));
    }

    const now = Date.now();
    const candidates = fetched.filter((msg) => {
      if (msg.pinned) return false;
      if (target && msg.author.id !== target.id) return false;
      return true;
    });

    const deletable = candidates.filter((msg) => now - msg.createdTimestamp < TWO_WEEKS_MS);
    const tooOld = candidates.size - deletable.size;

    if (deletable.size === 0) {
      const reason = tooOld > 0
        ? `All ${formatNumber(tooOld)} matching message(s) are older than 14 days, so Discord will not bulk delete them.`
        : 'There were no messages to delete.';
      return message.reply(replyOptions(errorEmbed({
        title: 'Nothing deleted',
        description: reason,
        footer: 'ZMB • clear',
      })));
    }

    let deleted;
    try {
      deleted = await channel.bulkDelete(deletable, false);
    } catch (error) {
      console.error(`[clear] bulkDelete failed in ${channel.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Clear failed',
        description: describeDiscordError(error, 'Discord rejected the bulk delete request. No messages were removed.'),
        footer: 'ZMB • clear',
      })));
    }

    const deletedCount = deleted ? deleted.size : 0;

    if (deletedCount === 0) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Nothing deleted',
        description: 'Discord reported that no messages could be deleted.',
        footer: 'ZMB • clear',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'clear',
      targetId: target ? target.id : channel.id,
      moderatorId: message.author.id,
      reason: `${deletedCount} message(s) cleared${target ? ` from ${target.user.tag}` : ''}`,
    });

    const notes = [];
    if (tooOld > 0) notes.push(`${formatNumber(tooOld)} message(s) skipped (older than 14 days).`);
    if (target && deletedCount < amount) notes.push(`Only ${formatNumber(deletedCount)} of the requested ${formatNumber(amount)} messages matched the member filter.`);

    return message.reply(replyOptions(successEmbed({
      title: 'Messages cleared',
      description: `Deleted **${formatNumber(deletedCount)}** message(s) in <#${channel.id}>.${notes.length ? `\n${notes.join('\n')}` : ''}`,
      footer: 'ZMB • clear',
      fields: [
        { name: 'Requested', value: formatNumber(amount), inline: true },
        { name: 'Deleted', value: formatNumber(deletedCount), inline: true },
        { name: 'Filter', value: target ? `<@${target.id}>` : 'All messages', inline: true },
      ],
    })));
  },
};
