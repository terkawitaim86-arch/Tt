const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const {
  moderationEmbed,
  usageErrorEmbed,
  logCommandError,
  inlineCode,
} = require('../../utils/embedUtils');

const command = {
  name: 'clear',
  description: 'Delete a number of recent messages from the channel.',
  category: 'Moderation',
  usage: 'clear <amount> [@member]',
  aliases: ['purge', 'c'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return fail('You need the **Manage Messages** permission to use this command.', 'Missing permission');
    }

    const amount = parseInt(args[0], 10);
    if (!amount || amount < 1 || amount > 100) {
      return fail('The amount must be a whole number between **1 and 100**.');
    }

    const targetMember = message.mentions.members.first() || null;

    try {
      let messages = await message.channel.messages.fetch({ limit: amount + 1 });

      if (targetMember) {
        messages = messages.filter((m) => m.author.id === targetMember.id);
      }

      const toDelete = Array.from(messages.values()).slice(0, amount + (targetMember ? 0 : 1));

      if (toDelete.length === 0) {
        return fail('No messages matched that request, so nothing was deleted.', 'Nothing to delete');
      }

      const deleted = await message.channel.bulkDelete(toDelete, true);

      if (targetMember) {
        await logAction({
          guildId: message.guild.id,
          action: 'clear',
          targetId: targetMember.id,
          moderatorId: message.author.id,
          reason: `Cleared ${deleted.size} messages from ${targetMember.user.tag}`,
        });
      } else {
        await logAction({
          guildId: message.guild.id,
          action: 'clear',
          targetId: 'channel',
          moderatorId: message.author.id,
          reason: `Cleared ${deleted.size} messages in #${message.channel.name}`,
        });
      }

      const extraFields = [
        { name: 'Deleted', value: `${deleted.size} message${deleted.size === 1 ? '' : 's'}`, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
      ];

      if (targetMember) {
        extraFields.push({
          name: 'Filtered by',
          value: `${inlineCode(targetMember.id)} (${targetMember.user.tag})`,
          inline: false,
        });
      }

      const embed = moderationEmbed({
        title: 'Messages cleared',
        description: `Recent messages were removed from **#${message.channel.name}**.`,
        moderator: message.author,
        target: null,
        extraFields,
      });

      const reply = await message.channel.send({ embeds: [embed] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);

      return;
    } catch (error) {
      logCommandError('clear', error);

      if (error.code === 50034) {
        return fail(
          'I can only bulk delete messages from the **last 14 days**. Older messages must be deleted individually.',
          'Messages too old'
        );
      }

      return fail('I could not delete those messages. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
