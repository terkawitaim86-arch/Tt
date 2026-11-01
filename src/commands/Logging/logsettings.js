const { PermissionFlagsBits } = require('discord.js');
const { getSettings } = require('../../utils/guildSettings');
const { infoEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'logsettings',
  description: 'View the current logging configuration.',
  category: 'Logging',
  usage: 'logsettings',
  aliases: ['logconfig'],
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

    let settings;
    try {
      settings = await getSettings(message.guild.id);
    } catch (error) {
      console.error('[logsettings] fetch failed:', error?.message || error);
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Settings unavailable',
            description: 'I could not load the logging configuration. Please try again.',
          })
        )
      );
    }

    const channels = [
      { label: 'Chat Logs', value: settings.log_chat_channel_id, desc: 'Deleted & edited messages' },
      { label: 'Server Logs', value: settings.log_server_channel_id, desc: 'Joins, leaves, bans, nicknames' },
      { label: 'Role Logs', value: settings.log_role_channel_id, desc: 'Role created/deleted/updated' },
      { label: 'Mod Logs', value: settings.log_mod_channel_id, desc: 'Mod actions (ban, kick, warn, etc.)' },
    ];

    const embed = infoEmbed({
      title: 'Logging Configuration',
      fields: channels.map((ch) => ({
        name: `${ch.label} — ${ch.desc}`,
        value: ch.value ? `<#${ch.value}>` : 'Not set',
        inline: false,
      })),
      footer: 'Use ,setlogchannel <type> <#channel> to configure',
    });

    return message.reply(replyOptions(embed));
  },
};
