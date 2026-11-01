const { PermissionFlagsBits } = require('discord.js');
const { updateSettings } = require('../../utils/guildSettings');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');

const TYPE_MAP = {
  chat: 'log_chat_channel_id',
  server: 'log_server_channel_id',
  role: 'log_role_channel_id',
  mod: 'log_mod_channel_id',
};

module.exports = {
  name: 'setlogchannel',
  description: 'Set a log channel for a specific log type (chat, server, role, mod).',
  category: 'Logging',
  usage: 'setlogchannel <type> <#channel>',
  aliases: ['logchannel'],
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

    const type = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first();

    if (!type || !TYPE_MAP[type]) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'setlogchannel',
            syntax: 'setlogchannel <type> <#channel>',
            example: 'setlogchannel mod #mod-logs',
            description: `Valid types: **${Object.keys(TYPE_MAP).join(', ')}**.`,
          })
        )
      );
    }

    if (!channel) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'setlogchannel',
            syntax: 'setlogchannel <type> <#channel>',
            example: `setlogchannel ${type} #logs`,
            description: 'You must mention the channel that should receive these logs.',
          })
        )
      );
    }

    const column = TYPE_MAP[type];
    const success = await updateSettings(message.guild.id, { [column]: channel.id });

    if (!success) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Log channel not saved',
            description: 'Failed to save the log channel. Please try again.',
          })
        )
      );
    }

    const embed = successEmbed({
      title: 'Log Channel Set',
      fields: [
        { name: 'Type', value: type, inline: true },
        { name: 'Channel', value: `<#${channel.id}>`, inline: true },
      ],
      footer: 'ZMB • Logging',
    });

    return message.reply(replyOptions(embed));
  },
};
