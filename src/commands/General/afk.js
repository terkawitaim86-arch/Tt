const config = require('../../config');
const { setAfk, removeAfk, getAfk } = require('../../utils/afkManager');
const { infoEmbed, successEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'afk',
  description: 'Set an AFK status. Automatically removed when you send a message.',
  category: 'General',
  usage: 'afk [reason]',
  aliases: [],
  async execute(message, args, client) {
    const reason = args.join(' ') || 'AFK';
    const guildId = message.guild.id;
    const userId = message.author.id;

    try {
      const existing = await getAfk(guildId, userId);

      if (existing) {
        await removeAfk(guildId, userId);
        const embed = successEmbed({
          title: 'Welcome back',
          description: `Your AFK status has been removed, <@${userId}>.`,
          footer: `${config.botName} • AFK`,
        });
        return message.reply(replyOptions(embed));
      }

      await setAfk(guildId, userId, reason);

      const embed = infoEmbed({
        title: 'AFK Status Set',
        description: `<@${userId}> is now AFK.`,
        fields: [{ name: 'Reason', value: reason.slice(0, 1024), inline: false }],
        footer: `${config.botName} • AFK`,
      });

      return message.reply(replyOptions(embed));
    } catch (error) {
      const embed = errorEmbed({
        title: 'AFK update failed',
        description: 'Your AFK status could not be saved. Please try again in a moment.',
      });
      return message.reply(replyOptions(embed));
    }
  },
};
