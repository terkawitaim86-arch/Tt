const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { getLeaderboard } = require('../../utils/xpManager');

module.exports = {
  name: 'leaderboard',
  description: 'Show the top 10 members by XP.',
  category: 'XP & Levels',
  usage: 'leaderboard',
  aliases: ['top', 'lb'],
  async execute(message, args, client) {
    const leaderboard = await getLeaderboard(message.guild.id, 10);

    if (leaderboard.length === 0) {
      return message.reply('No XP data yet. Start chatting to earn XP!');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`XP Leaderboard — ${message.guild.name}`)
      .setTimestamp();

    const medals = ['first', 'second', 'third'];
    const lines = leaderboard.map((entry, i) => {
      const medal = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : `${i + 1}.`;
      return `${medal} <@${entry.user_id}> — Level ${entry.level} (${entry.xp} XP)`;
    });

    embed.setDescription(lines.join('\n'));

    return message.reply({ embeds: [embed] });
  },
};
