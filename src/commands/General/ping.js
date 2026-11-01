const { infoEmbed } = require('../../utils/embedUtils');

const command = {
  name: 'ping',
  description: "Check the bot's latency.",
  category: 'General',
  usage: 'ping',
  aliases: [],
  async execute(message, args, client) {
    const apiLatency = client.ws.ping;

    const build = (latency) =>
      infoEmbed({
        title: 'Pong',
        description: 'Round-trip latency for the gateway and this server.',
        fields: [
          { name: 'API latency', value: `${apiLatency} ms`, inline: true },
          { name: 'Message latency', value: latency, inline: true },
        ],
        footerContext: 'Latency',
      });

    const reply = await message.reply({ embeds: [build('Measuring…')] });
    const msgLatency = reply.createdTimestamp - message.createdTimestamp;
    return reply.edit({ embeds: [build(`${msgLatency} ms`)] });
  },
};

module.exports = command;
