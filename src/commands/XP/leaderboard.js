const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { getLeaderboard } = require('../../utils/xpManager');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  name: 'leaderboard',
  description: 'Show the top 10 members by XP.',
  category: 'XP & Levels',
  usage: 'leaderboard',
  aliases: ['top', 'lb'],
  async execute(message) {
    const leaderboard = await getLeaderboard(message.guild.id, 10);

    if (leaderboard.length === 0) {
      return message.reply({ content: 'No XP data yet. Start chatting to earn XP!', allowedMentions: { repliedUser: false } });
    }

    const lines = leaderboard.map((entry, i) => {
      const medal = MEDALS[i] || `\`#${i + 1}\``;
      return `${medal} <@${entry.user_id}>\n┕ Level **${entry.level}** • ${Number(entry.xp).toLocaleString('en-US')} XP`;
    });

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setAuthor({ name: `${message.guild.name} • XP Leaderboard`, iconURL: message.guild.iconURL() || undefined })
      .setDescription(lines.join('\n'))
      .setFooter({ text: 'ZMB • Top 10' })
      .setTimestamp();

    return message.reply({ embeds: [embed], allowedMentions: { parse: [], repliedUser: false } });
  },
};
