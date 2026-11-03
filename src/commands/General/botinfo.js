
const { infoEmbed, errorEmbed } = require('../../utils/embedUtils');
const config = require('../../config');

module.exports = {
  name: 'botinfo',
  description: 'Shows information about the bot.',
  category: 'General',
  usage: 'botinfo',
  aliases: ['info'],

  execute(message, args, client) {
    try {
      if (!client?.user) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: 'Bot information is not available right now.',
            }),
          ],
        });
      }

      const uptime = Math.floor(process.uptime());

      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;

      const commandCount = new Set(
        [...client.commands.values()].map((command) => command.name)
      ).size;

      const embed = infoEmbed({
        title: config.botName || 'ZMB OFFICIAL',
        description:
          'Your all-in-one Discord community bot, built for moderation, XP, logging, and server management.',
        thumbnail: client.user.displayAvatarURL({ size: 256 }),

        fields: [
          {
            name: 'Servers',
            value: `\`${client.guilds.cache.size}\``,
            inline: true,
          },
          {
            name: 'Cached Users',
            value: `\`${client.users.cache.size}\``,
            inline: true,
          },
          {
            name: 'Commands',
            value: `\`${commandCount}\``,
            inline: true,
          },
          {
            name: 'Uptime',
            value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``,
            inline: true,
          },
          {
            name: 'WebSocket Ping',
            value: `\`${Math.round(client.ws.ping)}ms\``,
            inline: true,
          },
          {
            name: 'Node.js',
            value: `\`${process.version}\``,
            inline: true,
          },
        ],

        footer: 'ZMB OFFICIAL • Bot Information',
      });

      return message.reply({
        embeds: [embed],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      console.error('[BotInfo] Command failed:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            description: 'Something went wrong while retrieving bot information.',
          }),
        ],
      });
    }
  },
};
