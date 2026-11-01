const config = require('../../config');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber } = require('../../utils/format');

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

    const embed = infoEmbed({
      title: `About ${config.botName}`,
      description: `${config.botName} — built on discord.js v14.`,
      thumbnail: client.user.displayAvatarURL({ size: 256 }),
      fields: [
        { name: 'Servers', value: formatNumber(client.guilds.cache.size), inline: true },
        { name: 'Users', value: formatNumber(client.users.cache.size), inline: true },
        { name: 'Commands', value: formatNumber(client.commands.size), inline: true },
        { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
        { name: 'Library', value: 'discord.js v14', inline: true },
        { name: 'Created', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true },
      ],
      footer: `${config.botName} • Info`,
    });

    return message.reply(replyOptions(embed));
  },
};
