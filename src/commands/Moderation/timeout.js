const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

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

module.exports = {
  name: 'timeout',
  description: 'Timeout a member for a duration (e.g. 10m, 1h, 2d).',
  category: 'Moderation',
  usage: 'timeout <@member> <duration> [reason]',
  aliases: ['mute'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You need the **Moderate Members** (Timeout) permission to use this command.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
      return message.reply(`Usage: \`${prefix}timeout <@member> <duration> [reason]\`\nDurations: s, m, h, d, w (e.g. \`10m\`, \`1h\`)`);
    }

    if (member.id === message.author.id) {
      return message.reply('You cannot timeout yourself.');
    }

    if (!member.moderatable) {
      return message.reply('I cannot timeout that member — they may have a higher role than me.');
    }

    const durationInput = args[1];
    if (!durationInput) {
      const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
      return message.reply(`You must specify a duration. Usage: \`${prefix}timeout <@member> <duration> [reason]\`\nDurations: s, m, h, d, w (e.g. \`10m\`, \`1h\`)`);
    }

    const parsed = parseDuration(durationInput);
    if (!parsed) {
      return message.reply(`Invalid duration \`${durationInput}\`. Use formats like \`10m\`, \`1h\`, \`2d\`, \`1w\`.`);
    }

    if (parsed.seconds > 2419200) {
      return message.reply('The maximum timeout duration is **28 days**.');
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

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🔇 Member Timed Out')
        .addFields(
          { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Duration', value: parsed.display, inline: true },
          { name: 'Until', value: `<t:${Math.floor(until.getTime() / 1000)}:R>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[timeout] Failed:', error);
      return message.reply('Failed to timeout that member. Please try again.');
    }
  },
};
