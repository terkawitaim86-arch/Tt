const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'botinfo',
  description: 'Shows information about the bot.',
  category: 'General',
  usage: 'botinfo',
  aliases: ['info'],
  async execute(message, args, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`About ${config.botName}`)
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Users', value: `${client.users.cache.size}`, inline: true },
        { name: 'Commands', value: `${client.commands.size}`, inline: true },
        { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
        { name: 'Library', value: 'discord.js v14', inline: true },
        { name: 'Created', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
