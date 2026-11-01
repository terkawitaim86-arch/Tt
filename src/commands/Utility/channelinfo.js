const { infoEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');

const TYPE_NAMES = {
  0: 'Text',
  2: 'Voice',
  4: 'Category',
  5: 'Announcement',
  13: 'Stage',
  15: 'Forum',
};

module.exports = {
  name: 'channelinfo',
  description: 'Shows information about a channel.',
  category: 'Utility',
  usage: 'channelinfo [#channel]',
  aliases: ['channel'],
  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;

    try {
      const fields = [
        { name: 'ID', value: channel.id, inline: true },
        { name: 'Type', value: TYPE_NAMES[channel.type] || 'Unknown', inline: true },
        { name: 'Category', value: channel.parent ? `<#${channel.parentId}>` : 'None', inline: true },
        {
          name: 'Created',
          value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
        { name: 'Position', value: `${channel.position ?? '—'}`, inline: true },
      ];

      if (channel.topic) {
        fields.push({ name: 'Topic', value: channel.topic.slice(0, 1024), inline: false });
      }

      const embed = infoEmbed({
        title: `#${channel.name}`,
        fields,
        footer: 'ZMB • Channel Info',
      });

      return message.reply(replyOptions(embed));
    } catch (error) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Channel info failed',
            description: 'That channel could not be inspected. Please try again.',
          })
        )
      );
    }
  },
};
