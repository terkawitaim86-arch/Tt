const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'setwelcome',
  description: 'Set the welcome channel and message.',
  category: 'Welcome',
  usage: 'setwelcome <#channel> <message>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const channel = message.mentions.channels.first();
    const msgText = args.slice(1).join(' ');

    if (!channel) {
      return message.reply('Usage: `setwelcome <#channel> [message]`\nPlaceholders: `{user}`, `{server}`, `{count}`');
    }

    const success = await updateSettings(message.guild.id, {
      welcome_channel_id: channel.id,
      welcome_message: msgText || 'Welcome {user} to **{server}**! You are member #{count}.',
    });

    if (!success) {
      return message.reply('Failed to save welcome settings. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Welcome System Set')
      .addFields(
        { name: 'Channel', value: `<#${channel.id}>`, inline: true },
        { name: 'Message', value: msgText || 'Welcome {user} to **{server}**! You are member #{count}.', inline: false }
      )
      .setFooter({ text: 'Placeholders: {user}, {server}, {count}' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
