const { getXpData, levelForXp, getRank } = require('../../utils/xpManager');
const { infoEmbed, logCommandError, createBaseEmbed, COLORS } = require('../../utils/embedUtils');

const command = {
  name: 'rank',
  description: "Show your XP rank card or someone else's.",
  category: 'XP & Levels',
  usage: 'rank [@user]',
  aliases: ['level', 'xp'],
  async execute(message, args, client) {
    const member = message.mentions.members.first() || message.member;

    try {
      const data = await getXpData(message.guild.id, member.id);

      if (!data) {
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'No XP yet',
              description: `${member} has not earned XP in this server yet.`,
              fields: [{ name: 'Start earning', value: `Send a message in a channel where XP is enabled.`, inline: false }],
              footerContext: 'Levels',
            }),
          ],
          allowedMentions: { repliedUser: false },
        });
      }

      const { level, currentXp, neededXp } = levelForXp(data.xp);
      const { rank, total } = await getRank(message.guild.id, member.id);
      const progress = neededXp > 0 ? Math.min(100, Math.round((currentXp / neededXp) * 100)) : 100;
      const filled = Math.max(0, Math.min(10, Math.round(progress / 10)));
      const bar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);

      return message.reply({
        embeds: [
          infoEmbed({
            title: `${member.displayName}'s rank`,
            thumbnail: member.user.displayAvatarURL({ size: 128 }),
            fields: [
              { name: 'Level', value: `${level}`, inline: true },
              { name: 'Rank', value: rank ? `#${rank} of ${total}` : 'Unranked', inline: true },
              { name: 'Total XP', value: Number(data.xp).toLocaleString('en-US'), inline: true },
              { name: 'Progress to next level', value: `${bar} ${progress}%\n${currentXp} / ${neededXp} XP`, inline: false },
            ],
            footerContext: 'Levels',
          }),
        ],
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      logCommandError('rank', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Rank unavailable',
            description: 'Your rank could not be loaded. Please try again.',
            color: COLORS.error,
            footerContext: 'Levels',
          }),
        ],
      });
    }
  },
};

module.exports = command;
