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
  name: 'unban',
  description: 'Unban a user by their ID.',
  category: 'Moderation',
  usage: 'unban <user_id> [reason]',
  aliases: [],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return fail('You need the **Ban Members** permission to use this command.', 'Missing permission');
    }

    const userId = args[0];
    if (!userId || !/^\d+$/.test(userId)) {
      return fail("Provide the user ID of the banned member (right-click → Copy User ID).");
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await message.guild.bans.remove(userId, `${message.author.tag}: ${reason}`);
      await logAction({
        guildId: message.guild.id,
        action: 'unban',
        targetId: userId,
        moderatorId: message.author.id,
        reason,
      });

      const embed = moderationEmbed({
        title: 'User unbanned',
        description: `A user was unbanned from **${message.guild.name}**.`,
        moderator: message.author,
        target: null,
        reason,
        extraFields: [{ name: 'User ID', value: `\`${userId}\``, inline: true }],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      if (error.code === 10026) {
        return fail('That user is not banned.', 'Not banned');
      }
      logCommandError('unban', error);
      return fail('I could not unban that user. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
