const { infoEmbed } = require('../../utils/embedUtils');

const command = {
  name: 'serverinfo',
  description: 'Shows information about the server.',
  category: 'General',
  usage: 'serverinfo',
  aliases: ['server', 'guildinfo'],
  async execute(message, args, client) {
    const guild = message.guild;
    await guild.members.fetch();

    const textChannels = guild.channels.cache.filter((c) => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === 2).size;
    const categories = guild.channels.cache.filter((c) => c.type === 4).size;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;

    return message.reply({
      embeds: [
        infoEmbed({
          title: guild.name,
          description: `Server information for **${guild.name}**.`,
          thumbnail: guild.iconURL({ size: 256 }),
          fields: [
            { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
            { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Members', value: `${guild.memberCount} total\n${humans} humans · ${bots} bots`, inline: true },
            { name: 'Channels', value: `${textChannels} text\n${voiceChannels} voice\n${categories} categories`, inline: true },
            { name: 'Roles', value: String(guild.roles.cache.size), inline: true },
            { name: 'Boost level', value: `Level ${guild.premiumTier} · ${guild.premiumSubscriptionCount ?? 0} boosts`, inline: true },
            { name: 'Verification', value: String(guild.verificationLevel), inline: true },
            { name: '2FA for moderators', value: guild.mfaLevel ? 'Required' : 'Not required', inline: true },
          ],
          footerContext: 'Server information',
        }),
      ],
    });
  },
};

module.exports = command;
