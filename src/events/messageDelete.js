const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (message.partial || message.author?.bot) return;

    const settings = await getSettings(message.guild?.id);
    if (!settings.log_chat_channel_id) return;

    const logChannel = message.guild.channels.cache.get(settings.log_chat_channel_id);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🗑️ Message Deleted')
      .addFields(
        { name: 'Author', value: `<@${message.author.id}> (${message.author.tag})`, inline: false },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: false },
        { name: 'Content', value: message.content || 'No content', inline: false }
      )
      .setTimestamp(message.createdTimestamp);

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[messageDelete] Failed to send log message:', err)
    );
  },
};
