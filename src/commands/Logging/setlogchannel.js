const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

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
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const type = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first();

    if (!type || !TYPE_MAP[type]) {
      return message.reply(`Usage: \`setlogchannel <type> <#channel>\`\nTypes: **${Object.keys(TYPE_MAP).join(', ')}**`);
    }

    if (!channel) {
      return message.reply('You must mention a channel. Usage: `setlogchannel <type> <#channel>`');
    }

    const column = TYPE_MAP[type];
    const success = await updateSettings(message.guild.id, { [column]: channel.id });

    if (!success) {
      return message.reply('Failed to save the log channel. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Log Channel Set')
      .addFields(
        { name: 'Type', value: type, inline: true },
        { name: 'Channel', value: `<#${channel.id}>`, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
