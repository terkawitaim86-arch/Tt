const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const settings = await getSettings(newMessage.guild?.id);
    if (!settings.log_chat_channel_id) return;

    const logChannel = newMessage.guild.channels.cache.get(settings.log_chat_channel_id);
    if (!logChannel) return;

    const messageLink = `https://discord.com/channels/${newMessage.guild.id}/${newMessage.channelId}/${newMessage.id}`;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📝 Message Edited')
      .addFields(
        { name: 'Author', value: `<@${newMessage.author.id}> (${newMessage.author.tag})`, inline: false },
        { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: false },
        { name: 'Before', value: oldMessage.content || 'No content', inline: false },
        { name: 'After', value: newMessage.content || 'No content', inline: false },
        { name: 'Jump to Message', value: `[Click here](${messageLink})`, inline: false }
      )
      .setTimestamp(newMessage.editedTimestamp || newMessage.createdTimestamp);

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[messageUpdate] Failed to send log message:', err)
    );
  },
};
