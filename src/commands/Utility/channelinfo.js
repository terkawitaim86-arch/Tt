const { infoEmbed, normalizeColor } = require('../../utils/embedUtils');

const TYPE_NAMES = {
  0: 'Text',
  2: 'Voice',
  4: 'Category',
  5: 'Announcement',
  13: 'Stage',
  15: 'Forum',
};

const command = {
  name: 'channelinfo',
  description: 'Shows information about a channel.',
  category: 'Utility',
  usage: 'channelinfo [#channel]',
  aliases: ['channel'],
  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;

    const fields = [
      { name: 'Channel ID', value: `\`${channel.id}\``, inline: true },
      { name: 'Type', value: TYPE_NAMES[channel.type] || 'Unknown', inline: true },
      { name: 'Category', value: channel.parent ? `<#${channel.parentId}>` : 'None', inline: true },
      { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
      { name: 'Position', value: String(channel.position ?? '—'), inline: true },
    ];

    if (channel.topic) {
      fields.push({ name: 'Topic', value: channel.topic, inline: false });
    }

    return message.reply({
      embeds: [
        infoEmbed({
          title: `#${channel.name}`,
          description: 'Channel information.',
          color: normalizeColor('info'),
          fields,
          footerContext: 'Channel information',
        }),
      ],
    });
  },
};

module.exports = command;
