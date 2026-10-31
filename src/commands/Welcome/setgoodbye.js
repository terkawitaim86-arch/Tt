const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'setgoodbye',
  description: 'Set the goodbye channel and message.',
  category: 'Welcome',
  usage: 'setgoodbye <#channel> [message]',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const channel = message.mentions.channels.first();
    const msgText = args.slice(1).join(' ');

    if (!channel) {
      return message.reply('Usage: `setgoodbye <#channel> [message]`\nPlaceholders: `{user}`, `{server}`, `{count}`');
    }

    const success = await updateSettings(message.guild.id, {
      goodbye_channel_id: channel.id,
      goodbye_message: msgText || '**{user}** has left **{server}**. We\'ll miss you!',
    });

    if (!success) {
      return message.reply('Failed to save goodbye settings. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Goodbye System Set')
      .addFields(
        { name: 'Channel', value: `<#${channel.id}>`, inline: true },
        { name: 'Message', value: msgText || '**{user}** has left **{server}**. We\'ll miss you!', inline: false }
      )
      .setFooter({ text: 'Placeholders: {user}, {server}, {count}' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
