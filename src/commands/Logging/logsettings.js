const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'logsettings',
  description: 'View the current logging configuration.',
  category: 'Logging',
  usage: 'logsettings',
  aliases: ['logconfig'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const settings = await getSettings(message.guild.id);

    const channels = [
      { name: 'Chat Logs', value: settings.log_chat_channel_id, desc: 'Deleted & edited messages' },
      { name: 'Server Logs', value: settings.log_server_channel_id, desc: 'Joins, leaves, bans, nicknames' },
      { name: 'Role Logs', value: settings.log_role_channel_id, desc: 'Role created/deleted/updated' },
      { name: 'Mod Logs', value: settings.log_mod_channel_id, desc: 'Mod actions (ban, kick, warn, etc.)' },
    ];

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Logging Configuration')
      .setTimestamp();

    for (const ch of channels) {
      embed.addFields({
        name: `${ch.name} — ${ch.desc}`,
        value: ch.value ? `<#${ch.value}>` : 'Not set',
        inline: false,
      });
    }

    embed.setFooter({ text: `Use ,setlogchannel <type> <#channel> to configure` });

    return message.reply({ embeds: [embed] });
  },
};
