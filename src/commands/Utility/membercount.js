const { infoEmbed } = require('../../utils/embedUtils');

const command = {
  name: 'membercount',
  description: 'Show the current member count of the server.',
  category: 'Utility',
  usage: 'membercount',
  aliases: ['mc'],
  async execute(message, args, client) {
    const guild = message.guild;
    await guild.members.fetch();

    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;

    return message.reply({
      embeds: [
        infoEmbed({
          title: `Member count — ${guild.name}`,
          description: `**${guild.memberCount}** members in this server.`,
          thumbnail: guild.iconURL({ size: 128 }),
          fields: [
            { name: 'Total', value: String(guild.memberCount), inline: true },
            { name: 'Humans', value: String(humans), inline: true },
            { name: 'Bots', value: String(bots), inline: true },
          ],
          footerContext: 'Member count',
        }),
      ],
    });
  },
};

module.exports = command;
