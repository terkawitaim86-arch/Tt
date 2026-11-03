const { setAfk, removeAfk, getAfk } = require('../../utils/afkManager');
const { successEmbed, infoEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'afk',
  description: 'Set an AFK status. Automatically removed when you send a message.',
  category: 'General',
  usage: 'afk [reason]',
  aliases: [],
  async execute(message, args) {
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
            description: `<@${userId}>, your AFK status has been removed.`,
          }),
        ],
      });
    }

    await setAfk(guildId, userId, reason);
    return message.reply({
      embeds: [
        infoEmbed({
          title: 'AFK Status Set',
          description: `<@${userId}> is now AFK: **${reason}**`,
        }),
      ],
    });
  },
};
