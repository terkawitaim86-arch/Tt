const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'uptime',
  description: 'Shows how long the bot has been running.',
  category: 'General',
  usage: 'uptime',
  aliases: [],
  async execute(message, args, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Bot Uptime')
      .setDescription(`**${days}** days, **${hours}** hours, **${minutes}** minutes, **${seconds}** seconds`)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
