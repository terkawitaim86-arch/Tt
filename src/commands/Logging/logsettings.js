const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings } = require('../../utils/guildSettings');
const { getPrefix } = require('../../utils/prefixManager');
const { infoEmbed, usageErrorEmbed } = require('../../utils/embedUtils');

const command = {
  name: 'logsettings',
  description: 'View the current logging configuration.',
  category: 'Logging',
  usage: 'logsettings',
  aliases: ['logconfig'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const settings = await getSettings(message.guild.id);

    const channels = [
      { key: 'log_chat_channel_id', label: 'Chat logs', description: 'Deleted and edited messages' },
      { key: 'log_server_channel_id', label: 'Server logs', description: 'Joins, leaves, bans, nicknames' },
      { key: 'log_role_channel_id', label: 'Role logs', description: 'Roles created, deleted or updated' },
      { key: 'log_mod_channel_id', label: 'Mod logs', description: 'Ban, kick, warn and other actions' },
    ];

    return message.reply({
      embeds: [
        infoEmbed({
          title: 'Logging configuration',
          description: `Change a channel with \`${prefix}setlogchannel <type> <#channel>\`.`,
          fields: channels.map((channel) => ({
            name: channel.label,
            value: settings[channel.key] ? `<#${settings[channel.key]}>\n${channel.description}` : `Not set\n${channel.description}`,
            inline: false,
          })),
          footerContext: 'Logging',
        }),
      ],
    });
  },
};

module.exports = command;
