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

const command = {
  name: 'kick',
  description: 'Kick a member from the server.',
  category: 'Moderation',
  usage: 'kick <@member> [reason]',
  aliases: ['k'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return fail('You need the **Kick Members** permission to use this command.', 'Missing permission');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member you want to kick.');
    }

    const hierarchyError = checkHierarchy(message, member, 'kick');
    if (hierarchyError) {
      return fail(hierarchyError, 'Member cannot be kicked');
    }

    if (!member.kickable) {
      return fail('I cannot kick that member — they may have a higher role than me.', 'Member cannot be kicked');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.kick(`${message.author.tag}: ${reason}`);
      await logAction({
        guildId: message.guild.id,
        action: 'kick',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = moderationEmbed({
        title: 'Member kicked',
        description: `A member was kicked from **${message.guild.name}**.`,
        moderator: message.author,
        target: member,
        reason,
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('kick', error);
      return fail('I could not kick that member. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
