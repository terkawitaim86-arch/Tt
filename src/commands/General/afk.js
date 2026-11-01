const config = require('../../config');
const { setAfk, removeAfk, getAfk } = require('../../utils/afkManager');
const { successEmbed, infoEmbed, createBaseEmbed, COLORS } = require('../../utils/embedUtils');

const command = {
  name: 'afk',
  description: 'Set an AFK status. Automatically removed when you send a message.',
  category: 'General',
  usage: 'afk [reason]',
  aliases: [],
  async execute(message, args, client) {
    const reason = args.join(' ') || 'AFK';
    const guildId = message.guild.id;
    const userId = message.author.id;

    const existing = await getAfk(guildId, userId);
    if (existing) {
      await removeAfk(guildId, userId);
      return message.reply({
        embeds: [
          successEmbed({
            title: 'Welcome back',
            description: `Your AFK status has been removed, ${message.author}.`,
          }),
        ],
      });
    }

    await setAfk(guildId, userId, reason);

    return message.reply({
      embeds: [
        createBaseEmbed({
          title: 'AFK status set',
          description: `${message.author} is now AFK.`,
          fields: [{ name: 'Status message', value: reason, inline: false }],
          color: COLORS.info,
          footerContext: 'AFK',
        }),
      ],
    });
  },
};

module.exports = command;
