const { PermissionFlagsBits } = require('discord.js');
const { updateSettings } = require('../../utils/guildSettings');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { truncate } = require('../../utils/format');

const DEFAULT_MESSAGE = "**{user}** has left **{server}**. We'll miss you!";

module.exports = {
  name: 'setgoodbye',
  description: 'Set the goodbye channel and message.',
  category: 'Welcome',
  usage: 'setgoodbye <#channel> [message]',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Server** permission to use this command.',
          })
        )
      );
    }

    const channel = message.mentions.channels.first();
    const msgText = args.slice(1).join(' ');

    if (!channel) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'setgoodbye',
            syntax: 'setgoodbye <#channel> [message]',
            example: 'setgoodbye #goodbye {user} left {server}.',
            description: 'Placeholders: `{user}`, `{server}`, `{count}`.\nLeave the message empty to use the default text.',
          })
        )
      );
    }

    const finalMessage = msgText || DEFAULT_MESSAGE;
    const success = await updateSettings(message.guild.id, {
      goodbye_channel_id: channel.id,
      goodbye_message: finalMessage,
    });

    if (!success) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Goodbye settings not saved',
            description: 'Failed to save goodbye settings. Please try again.',
          })
        )
      );
    }

    return message.reply(
      replyOptions(
        successEmbed({
          title: 'Goodbye System Set',
          fields: [
            { name: 'Channel', value: `<#${channel.id}>`, inline: true },
            { name: 'Message', value: truncate(finalMessage, 1024), inline: false },
          ],
          footer: 'ZMB • Placeholders: {user}, {server}, {count}',
        })
      )
    );
  },
};
