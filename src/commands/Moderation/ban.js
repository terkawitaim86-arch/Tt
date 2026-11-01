const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { checkHierarchy } = require('../../utils/modChecks');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const {
  moderationEmbed,
  usageErrorEmbed,
  logCommandError,
  inlineCode,
} = require('../../utils/embedUtils');

const command = {
  name: 'ban',
  description: 'Ban a member from the server.',
  category: 'Moderation',
  usage: 'ban <@member> [reason]',
  aliases: ['b'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return fail('You need the **Ban Members** permission to use this command.', 'Missing permission');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member you want to ban.');
    }

    const hierarchyError = checkHierarchy(message, member, 'ban');
    if (hierarchyError) {
      return fail(hierarchyError, 'Member cannot be banned');
    }

    if (!member.bannable) {
      return fail('I cannot ban that member — they may have a higher role than me.', 'Member cannot be banned');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.ban({ reason: `${message.author.tag}: ${reason}` });
      await logAction({
        guildId: message.guild.id,
        action: 'ban',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = moderationEmbed({
        title: 'Member banned',
        description: `A member was banned from **${message.guild.name}**.`,
        moderator: message.author,
        target: member,
        reason,
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('ban', error);
      return fail('I could not ban that member. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
