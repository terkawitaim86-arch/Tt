const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate, formatDuration } = require('../../utils/format');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

const TIME_UNITS = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
const MAX_TIMEOUT_SECONDS = 28 * 86400;

function parseDuration(input) {
  if (typeof input !== 'string') return null;
  const match = /^(\d{1,6})([smhdw])$/.exec(input.trim().toLowerCase());
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { seconds: value * TIME_UNITS[match[2]], display: `${value}${match[2]}` };
}

module.exports = {
  name: 'timeout',
  description: 'Timeout a member for a duration (e.g. 10m, 1h, 2d).',
  category: 'Moderation',
  usage: 'timeout <@member> <duration> [reason]',
  aliases: ['to', 'mute'],
  parseDuration,
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const member = message.mentions.members.first();
    const durationInput = args[1];

    const usage = (description) => message.reply(replyOptions(usageEmbed({
      command: 'timeout',
      syntax: `${prefix}timeout <@member> <duration> [reason]`,
      example: `${prefix}timeout @Member 10m Spamming`,
      description: description || 'Durations support **s**, **m**, **h**, **d** and **w** units, up to 28 days.',
    })));

    if (!member || !durationInput) return usage();

    const parsed = parseDuration(durationInput);
    if (!parsed) {
      return usage(`\`${truncate(durationInput, 32)}\` is not a valid duration. Use formats like \`10m\`, \`1h\`, \`2d\`, \`1w\`.`);
    }
    if (parsed.seconds > MAX_TIMEOUT_SECONDS) {
      return usage('The maximum timeout duration is **28 days**.');
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ModerateMembers,
      permissionLabel: 'Moderate Members',
      botPermissions: { 'Moderate Members': PermissionFlagsBits.ModerateMembers },
      target: member,
      actionName: 'timeout',
      command: 'timeout',
    });
    if (denied) return message.reply(replyOptions(denied));

    const reason = truncate(args.slice(2).join(' ') || 'No reason provided', 900);

    try {
      await member.timeout(parsed.seconds * 1000, `${message.author.tag}: ${reason}`);
    } catch (error) {
      console.error(`[timeout] Failed for ${member.id}:`, error.message);
      return message.reply(replyOptions(errorEmbed({
        title: 'Timeout failed',
        description: describeDiscordError(error, 'I could not time out that member.'),
        footer: 'ZMB • timeout',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'timeout',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
      duration: parsed.display,
    });

    const until = new Date(Date.now() + parsed.seconds * 1000);

    return message.reply(replyOptions(successEmbed({
      title: 'Member timed out',
      description: `<@${member.id}> cannot talk for **${formatDuration(parsed.seconds)}**.`,
      footer: 'ZMB • timeout',
      fields: [
        { name: 'Member', value: `\`${member.user.tag}\``, inline: true },
        { name: 'Duration', value: parsed.display, inline: true },
        { name: 'Expires', value: `<t:${Math.floor(until.getTime() / 1000)}:R>`, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
