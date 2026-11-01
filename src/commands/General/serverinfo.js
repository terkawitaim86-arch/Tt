const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
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
    const roles = guild.roles.cache.size;
    const members = guild.memberCount;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Members', value: `${members} total\n${humans} humans • ${bots} bots`, inline: true },
        { name: 'Channels', value: `${textChannels} text\n${voiceChannels} voice\n${categories} categories`, inline: true },
        { name: 'Roles', value: `${roles}`, inline: true },
        { name: 'Boost Level', value: `Level ${guild.premiumTier}\n${guild.premiumSubscriptionCount} boosts`, inline: true },
        { name: 'Verification', value: guild.verificationLevel, inline: true },
        { name: 'Security', value: guild.mfaLevel ? '2FA Required' : 'None', inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
