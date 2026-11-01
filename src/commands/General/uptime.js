const config = require('../../config');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');

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

    const embed = infoEmbed({
      title: '⏱️ Bot Uptime',
      description: `**${days}** days, **${hours}** hours, **${minutes}** minutes, **${seconds}** seconds`,
      footer: `${config.botName} • Uptime`,
    });

    return message.reply(replyOptions(embed));
  },
};
