const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'channelinfo',
  description: 'Shows information about a channel.',
  category: 'Utility',
  usage: 'channelinfo [#channel]',
  aliases: ['channel'],
  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;

    const typeNames = {
      0: 'Text',
      2: 'Voice',
      4: 'Category',
      5: 'Announcement',
      13: 'Stage',
      15: 'Forum',
    };

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`#${channel.name}`)
      .addFields(
        { name: 'ID', value: channel.id, inline: true },
        { name: 'Type', value: typeNames[channel.type] || 'Unknown', inline: true },
        { name: 'Category', value: channel.parent ? `<#${channel.parentId}>` : 'None', inline: true },
        { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
        { name: 'Position', value: `${channel.position}`, inline: true }
      )
      .setTimestamp();

    if (channel.topic) {
      embed.addFields({ name: 'Topic', value: channel.topic, inline: false });
    }

    return message.reply({ embeds: [embed] });
  },
};
