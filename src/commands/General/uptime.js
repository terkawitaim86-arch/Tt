const { infoEmbed } = require('../../utils/embedUtils');

const command = {
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

    return message.reply({
      embeds: [
        infoEmbed({
          title: 'Uptime',
          description: `Running for **${days}d ${hours}h ${minutes}m ${seconds}s**.`,
          footerContext: 'Uptime',
        }),
      ],
    });
  },
};

module.exports = command;
