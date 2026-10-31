const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'announce',
  description: 'Send an announcement embed to a channel.',
  category: 'Utility',
  usage: 'announce <#channel> <message>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('You need the **Manage Messages** permission to use this command.');
    }

    const channel = message.mentions.channels.first();
    const text = args.slice(1).join(' ');

    if (!channel || !text) {
      return message.reply('Usage: `announce <#channel> <message>`');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Announcement')
      .setDescription(text)
      .setFooter({ text: `From ${message.author.tag}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    const confirm = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`Announcement sent to <#${channel.id}>.`);

    return message.reply({ embeds: [confirm] });
  },
};
