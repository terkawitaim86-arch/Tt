const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { getXpData, levelForXp, getRank } = require('../../utils/xpManager');

module.exports = {
  name: 'rank',
  description: 'Show your XP rank card or someone else\'s.',
  category: 'XP & Levels',
  usage: 'rank [@user]',
  aliases: ['level', 'xp'],
  async execute(message, args, client) {
    const member = message.mentions.members.first() || message.member;
    const data = await getXpData(message.guild.id, member.id);

    if (!data) {
      return message.reply(`<@${member.id}> has no XP yet. Start chatting to earn some!`);
    }

    const { level, currentXp, neededXp } = levelForXp(data.xp);
    const { rank, total } = await getRank(message.guild.id, member.id);
    const progress = Math.round((currentXp / neededXp) * 100);
    const filled = Math.max(0, Math.min(10, Math.round(progress / 10)));
    const bar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`${member.displayName}'s Rank`)
      .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Level', value: `${level}`, inline: true },
        { name: 'Rank', value: rank ? `#${rank} / ${total}` : 'Unranked', inline: true },
        { name: 'Total XP', value: `${Number(data.xp).toLocaleString('en-US')}`, inline: true },
        { name: 'Progress', value: `${bar} ${progress}%\n${currentXp} / ${neededXp} XP`, inline: false }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  },
};
