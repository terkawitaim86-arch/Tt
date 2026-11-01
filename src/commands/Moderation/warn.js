const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { addWarning, logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const {
  moderationEmbed,
  usageErrorEmbed,
  logCommandError,
  inlineCode,
  COLORS,
} = require('../../utils/embedUtils');

const command = {
  name: 'warn',
  description: 'Warn a member. Warnings are stored and can be viewed with ,warnings.',
  category: 'Moderation',
  usage: 'warn <@member> [reason]',
  aliases: ['w'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return fail('You need the **Moderate Members** permission to use this command.', 'Missing permission');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member you want to warn.');
    }

    if (member.id === message.author.id) {
      return fail('You cannot warn yourself.', 'Invalid target');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const warningId = await addWarning({
        guildId: message.guild.id,
        userId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      await logAction({
        guildId: message.guild.id,
        action: 'warn',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = moderationEmbed({
        title: 'Member warned',
        description: `A formal warning was issued in **${message.guild.name}**.`,
        moderator: message.author,
        target: member,
        reason,
        color: COLORS.warning,
        extraFields: warningId
          ? [{ name: 'Warning ID', value: inlineCode(warningId.slice(0, 8)), inline: true }]
          : [],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('warn', error);
      return fail('I could not warn that member. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
