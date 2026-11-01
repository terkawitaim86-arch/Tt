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
  name: 'slowmode',
  description: 'Set the slowmode delay for a channel (0-21600 seconds).',
  category: 'Moderation',
  usage: 'slowmode <seconds> [channel]',
  aliases: ['slow'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return fail('You need the **Manage Channels** permission to use this command.', 'Missing permission');
    }

    const seconds = parseInt(args[0], 10);
    if (Number.isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return fail('The delay must be a whole number between **0 and 21600** seconds.');
    }

    const channel = message.mentions.channels.first() || message.channel;

    try {
      await channel.setRateLimitPerUser(seconds);

      await logAction({
        guildId: message.guild.id,
        action: 'slowmode',
        targetId: channel.id,
        moderatorId: message.author.id,
        reason: `Set slowmode to ${seconds}s`,
        duration: seconds > 0 ? `${seconds}s` : 'off',
      });

      const embed = moderationEmbed({
        title: seconds === 0 ? 'Slowmode disabled' : 'Slowmode updated',
        description:
          seconds === 0
            ? `Members can talk freely again in **#${channel.name}**.`
            : `Messages in **#${channel.name}** are now limited to one every **${seconds} second${seconds === 1 ? '' : 's'}**.`,
        moderator: message.author,
        target: null,
        extraFields: [{ name: 'Channel', value: `<#${channel.id}>`, inline: true }],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('slowmode', error);
      return fail('I could not set the slowmode. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
