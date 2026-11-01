const { getLeaderboard } = require('../../utils/xpManager');
const { infoEmbed, logCommandError, createBaseEmbed, COLORS, LIMITS } = require('../../utils/embedUtils');

const MEDALS = ['🥇', '🥈', '🥉'];

const command = {
  name: 'leaderboard',
  description: 'Show the top 10 members by XP.',
  category: 'XP & Levels',
  usage: 'leaderboard',
  aliases: ['top', 'lb'],
  async execute(message, args, client) {
    try {
      const leaderboard = await getLeaderboard(message.guild.id, 10);

      if (!leaderboard.length) {
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'No XP yet',
              description: 'Nobody has earned XP in this server yet. Start chatting to begin.',
              footerContext: 'Levels',
            }),
          ],
        });
      }

      const lines = leaderboard.map((entry, index) => {
        const place = MEDALS[index] || `**#${index + 1}**`;
        return `${place} <@${entry.user_id}> — level **${entry.level}** · ${Number(entry.xp).toLocaleString('en-US')} XP`;
      });

      return message.reply({
        embeds: [
          infoEmbed({
            title: 'XP leaderboard',
            description: lines.join('\n').slice(0, LIMITS.description),
            author: message.guild
              ? { name: message.guild.name, iconURL: message.guild.iconURL() || undefined }
              : undefined,
            footerContext: 'Top 10 members',
          }),
        ],
        allowedMentions: { parse: [], repliedUser: false },
      });
    } catch (error) {
      logCommandError('leaderboard', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Leaderboard unavailable',
            description: 'The leaderboard could not be loaded. Please try again.',
            color: COLORS.error,
            footerContext: 'Levels',
          }),
        ],
      });
    }
  },
};

module.exports = command;
