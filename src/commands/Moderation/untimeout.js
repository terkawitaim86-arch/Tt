const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const {
  moderationEmbed,
  usageErrorEmbed,
  logCommandError,
} = require('../../utils/embedUtils');

const command = {
  name: 'untimeout',
  description: 'Remove a timeout from a member.',
  category: 'Moderation',
  usage: 'untimeout <@member> [reason]',
  aliases: ['unmute'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return fail('You need the **Moderate Members** permission to use this command.', 'Missing permission');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member whose timeout you want to remove.');
    }

    if (!member.isCommunicationDisabled()) {
      return fail('That member is not currently timed out.', 'No active timeout');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.timeout(null, `${message.author.tag}: ${reason}`);
      await logAction({
        guildId: message.guild.id,
        action: 'untimeout',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = moderationEmbed({
        title: 'Timeout removed',
        description: `${member} can talk again in **${message.guild.name}**.`,
        moderator: message.author,
        target: member,
        reason,
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('untimeout', error);
      return fail('I could not remove the timeout. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
