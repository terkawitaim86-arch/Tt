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
  name: 'unlock',
  description: 'Unlock a previously locked channel.',
  category: 'Moderation',
  usage: 'unlock [channel] [reason]',
  aliases: [],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return fail('You need the **Manage Channels** permission to use this command.', 'Missing permission');
    }

    const channel = message.mentions.channels.first() || message.channel;
    const reason = args.filter((a) => !a.startsWith('<#')).join(' ') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null,
        AddReactions: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
      });

      await logAction({
        guildId: message.guild.id,
        action: 'unlock',
        targetId: channel.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = moderationEmbed({
        title: 'Channel unlocked',
        description: `**#${channel.name}** is open for messages again.`,
        moderator: message.author,
        target: null,
        reason,
        extraFields: [{ name: 'Channel', value: `<#${channel.id}>`, inline: true }],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('unlock', error);
      return fail('I could not unlock that channel. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
