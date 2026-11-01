const { getXpData, levelForXp, getRank } = require('../../utils/xpManager');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber, progressBar, progressPercent, positionLabel } = require('../../utils/format');

module.exports = {
  name: 'rank',
  description: "Show your XP rank card or someone else's.",
  category: 'XP & Levels',
  usage: 'rank [@user]',
  aliases: ['level', 'xp'],
  async execute(message, args, client) {
    const member = message.mentions.members.first() || message.member;
    const data = await getXpData(message.guild.id, member.id);

    if (!data) {
      return message.reply(
        replyOptions(
          infoEmbed({
            title: 'No XP yet',
            description: `<@${member.id}> has no XP yet. Start chatting to earn some!`,
          })
        )
      );
    }

    const { level, currentXp, neededXp } = levelForXp(data.xp);
    const { rank, total } = await getRank(message.guild.id, member.id);
    const percent = progressPercent(currentXp, neededXp);
    const bar = progressBar(currentXp, neededXp, 10);

    const embed = infoEmbed({
      title: `${member.user.tag}'s Rank`,
      thumbnail: member.user.displayAvatarURL({ size: 128 }),
      fields: [
        { name: 'Level', value: `${formatNumber(level)}`, inline: true },
        { name: 'Rank', value: rank ? `${positionLabel(rank - 1)} of ${formatNumber(total)}` : 'Unranked', inline: true },
        { name: 'Total XP', value: `${formatNumber(data.xp)} XP`, inline: true },
        { name: 'Progress', value: `${bar} ${percent}%\n${formatNumber(currentXp)} / ${formatNumber(neededXp)} XP to level ${formatNumber(level + 1)}`, inline: false },
      ],
      footer: 'ZMB • XP',
    });

    return message.reply(replyOptions(embed));
  },
};
