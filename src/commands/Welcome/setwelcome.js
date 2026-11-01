const { PermissionFlagsBits } = require('discord.js');
const { updateSettings } = require('../../utils/guildSettings');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { truncate } = require('../../utils/format');

const DEFAULT_MESSAGE = 'Welcome {user} to **{server}**! You are member #{count}.';

module.exports = {
  name: 'setwelcome',
  description: 'Set the welcome channel and message.',
  category: 'Welcome',
  usage: 'setwelcome <#channel> <message>',
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
            command: 'setwelcome',
            syntax: 'setwelcome <#channel> [message]',
            example: 'setwelcome #welcome Welcome {user} to {server}!',
            description: 'Placeholders: `{user}`, `{server}`, `{count}`.\nLeave the message empty to use the default text.',
          })
        )
      );
    }

    const finalMessage = msgText || DEFAULT_MESSAGE;
    const success = await updateSettings(message.guild.id, {
      welcome_channel_id: channel.id,
      welcome_message: finalMessage,
    });

    if (!success) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Welcome settings not saved',
            description: 'Failed to save welcome settings. Please try again.',
          })
        )
      );
    }

    return message.reply(
      replyOptions(
        successEmbed({
          title: 'Welcome System Set',
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
