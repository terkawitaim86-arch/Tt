const config = require('../../config');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'ping',
  description: "Check the bot's latency.",
  category: 'General',
  usage: 'ping',
  aliases: [],
  execute(message, args, client) {
    const apiLatency = client.ws.ping;

    const build = (messageLatency) =>
      infoEmbed({
        title: '🏓 Pong!',
        description: `Gateway latency is **${apiLatency}ms**.`,
        fields: [
          { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
          { name: 'Message Latency', value: messageLatency, inline: true },
        ],
        footer: `${config.botName} • Latency`,
      });

    message.reply(replyOptions(build('Calculating...'))).then((reply) => {
      const msgLatency = reply.createdTimestamp - message.createdTimestamp;
      return reply.edit(replyOptions(build(`${msgLatency}ms`)));
    });
  },
};
