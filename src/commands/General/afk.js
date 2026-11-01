const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { setAfk, removeAfk, getAfk } = require('../../utils/afkManager');

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

    const existing = await getAfk(guildId, userId);
    if (existing) {
      await removeAfk(guildId, userId);
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`Welcome back <@${userId}>! Your AFK status has been removed.`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    await setAfk(guildId, userId, reason);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('AFK Status Set')
      .setDescription(`<@${userId}> is now AFK: **${reason}**`)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
