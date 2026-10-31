const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'membercount',
  description: 'Show the current member count of the server.',
  category: 'Utility',
  usage: 'membercount',
  aliases: ['mc'],
  async execute(message, args, client) {
    const guild = message.guild;
    await guild.members.fetch();

    const total = guild.memberCount;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`Member Count — ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 128 }))
      .addFields(
        { name: 'Total', value: `${total}`, inline: true },
        { name: 'Humans', value: `${humans}`, inline: true },
        { name: 'Bots', value: `${bots}`, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
