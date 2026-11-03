const { PermissionFlagsBits } = require('discord.js');
const { getPrefix } = require('../../utils/prefixManager');
const { errorEmbed, usageEmbed, successEmbed, infoEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'announce',
  description: 'Send an announcement embed to a channel.',
  category: 'Utility',
  usage: 'announce <#channel> <message>',
  aliases: [],
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply({ embeds: [errorEmbed({ description: 'You need the **Manage Messages** permission.' })] });
    }
    const channel = message.mentions.channels.first();
    const text = args.slice(1).join(' ');
    if (!channel || !text) {
      const prefix = await getPrefix(message.guild.id);
      return message.reply({ embeds: [usageEmbed({ command: 'announce', syntax: `${prefix}announce <#channel> <message>` })] });
    }
    await channel.send({
      embeds: [
        infoEmbed({
          title: 'Announcement',
          description: text,
          footer: `From ${message.author.tag}`,
        }),
      ],
    });
    return message.reply({
      embeds: [successEmbed({ description: `Announcement sent to <#${channel.id}>.` })],
    });
  },
};
