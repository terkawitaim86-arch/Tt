const { BRAND } = require('../../utils/embedUtils');
const { infoEmbed } = require('../../utils/embedUtils');

const command = {
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

    return message.reply({
      embeds: [
        infoEmbed({
          title: `About ${BRAND}`,
          description: 'A prefix-command moderation and community bot built on discord.js v14.',
          thumbnail: client.user.displayAvatarURL({ size: 256 }),
          fields: [
            { name: 'Servers', value: String(client.guilds.cache.size), inline: true },
            { name: 'Users', value: String(client.users.cache.size), inline: true },
            { name: 'Commands', value: String(client.commands.size), inline: true },
            { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
            { name: 'Library', value: 'discord.js v14', inline: true },
            { name: 'Online since', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true },
          ],
          footerContext: 'Bot information',
        }),
      ],
    });
  },
};

module.exports = command;
