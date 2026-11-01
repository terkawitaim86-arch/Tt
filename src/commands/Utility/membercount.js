const { infoEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber } = require('../../utils/format');

module.exports = {
  name: 'membercount',
  description: 'Show the current member count of the server.',
  category: 'Utility',
  usage: 'membercount',
  aliases: ['mc'],
  async execute(message, args, client) {
    const guild = message.guild;

    try {
      await guild.members.fetch();
    } catch (error) {
      console.error('[membercount] member fetch failed:', error?.message || error);
    }

    const total = guild.memberCount;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;

    if (!total) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Member count unavailable',
            description: 'Discord did not return a member count for this server. Please try again.',
          })
        )
      );
    }

    const embed = infoEmbed({
      title: `Member Count — ${guild.name}`,
      thumbnail: guild.iconURL({ size: 128 }),
      fields: [
        { name: 'Total', value: formatNumber(total), inline: true },
        { name: 'Humans', value: formatNumber(humans), inline: true },
        { name: 'Bots', value: formatNumber(bots), inline: true },
      ],
      footer: 'ZMB • Member Count',
    });

    return message.reply(replyOptions(embed));
  },
};
