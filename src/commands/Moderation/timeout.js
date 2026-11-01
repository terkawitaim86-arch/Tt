const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { checkHierarchy } = require('../../utils/modChecks');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const {
  moderationEmbed,
  usageErrorEmbed,
  logCommandError,
} = require('../../utils/embedUtils');

const TIME_UNITS = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

function parseDuration(input) {
  const match = /^(\d+)([smhdw])$/.exec(input.toLowerCase());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return { seconds: value * TIME_UNITS[unit], display: `${value}${unit}` };
}

const command = {
  name: 'timeout',
  description: 'Timeout a member for a duration (e.g. 10m, 1h, 2d).',
  category: 'Moderation',
  usage: 'timeout <@member> <duration> [reason]',
  aliases: ['mute', 'to'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return fail(
        'You need the **Moderate Members** (Timeout) permission to use this command.',
        'Missing permission'
      );
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member you want to timeout.');
    }

    const hierarchyError = checkHierarchy(message, member, 'timeout');
    if (hierarchyError) {
      return fail(hierarchyError, 'Member cannot be timed out');
    }

    if (!member.moderatable) {
      return fail(
        'I cannot timeout that member — they may have a higher role than me.',
        'Member cannot be timed out'
      );
    }

    const durationInput = args[1];
    if (!durationInput) {
      return fail('You must specify a duration, such as `10m`, `1h` or `2d`.');
    }

    const parsed = parseDuration(durationInput);
    if (!parsed) {
      return fail(`\`${durationInput}\` is not a valid duration. Use s, m, h, d or w — for example \`10m\`.`);
    }

    if (parsed.seconds > 2419200) {
      return fail('The maximum timeout duration is **28 days**.');
    }

    const reason = args.slice(2).join(' ') || 'No reason provided';
    const until = new Date(Date.now() + parsed.seconds * 1000);

    try {
      await member.timeout(parsed.seconds * 1000, `${message.author.tag}: ${reason}`);
      await logAction({
        guildId: message.guild.id,
        action: 'timeout',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
        duration: parsed.display,
      });

      const embed = moderationEmbed({
        title: 'Member timed out',
        description: `A member was timed out in **${message.guild.name}**.`,
        moderator: message.author,
        target: member,
        reason,
        extraFields: [
          { name: 'Duration', value: parsed.display, inline: true },
          { name: 'Expires', value: `<t:${Math.floor(until.getTime() / 1000)}:R>`, inline: true },
        ],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('timeout', error);
      return fail('I could not timeout that member. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
