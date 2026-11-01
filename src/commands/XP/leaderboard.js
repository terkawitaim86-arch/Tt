const { getLeaderboard } = require('../../utils/xpManager');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber, positionLabel, truncate } = require('../../utils/format');

module.exports = {
  name: 'leaderboard',
  description: 'Show the top 10 members by XP.',
  category: 'XP & Levels',
  usage: 'leaderboard',
  aliases: ['top', 'lb'],
  async execute(message, args, client) {
    const leaderboard = await getLeaderboard(message.guild.id, 10);

    if (!leaderboard || leaderboard.length === 0) {
      return message.reply(
        replyOptions(
          infoEmbed({
            title: 'Leaderboard empty',
            description: 'No XP data yet. Start chatting to earn XP!',
          })
        )
      );
    }

    const lines = leaderboard.map((entry, i) => {
      const label = positionLabel(i);
      return `${label} <@${entry.user_id}> — Level ${formatNumber(entry.level)} · ${formatNumber(entry.xp)} XP`;
    });

    const embed = infoEmbed({
      title: `XP Leaderboard — ${message.guild.name}`,
      description: truncate(lines.join('\n'), 4000),
      footer: `Top ${leaderboard.length} members • ZMB`,
    });

    return message.reply(replyOptions(embed));
  },
};
