const config = require('../../config');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'userinfo',
  description: 'Shows information about a member.',
  category: 'General',
  usage: 'userinfo [@user]',
  aliases: ['user', 'whois', 'ui'],
  async execute(message, args, client) {
    const member = message.mentions.members.first() || message.member;

    const roles = member.roles.cache
      .filter((r) => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => `<@&${r.id}>`);

    const fields = [
      { name: 'User ID', value: member.id, inline: true },
      { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      {
        name: 'Joined Server',
        value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown',
        inline: true,
      },
      { name: 'Bot', value: member.user.bot ? 'Yes' : 'No', inline: true },
      {
        name: 'Boosting',
        value: member.premiumSince ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : 'No',
        inline: true,
      },
      {
        name: 'Highest Role',
        value: member.roles.highest.id !== message.guild.id ? `<@&${member.roles.highest.id}>` : 'None',
        inline: true,
      },
    ];

    if (roles.length > 0) {
      const roleList = roles.slice(0, 20).join(', ');
      fields.push({
        name: `Roles (${roles.length})`,
        value: roles.length > 20 ? `${roleList}, and ${roles.length - 20} more` : roleList,
        inline: false,
      });
    }

    const embed = infoEmbed({
      title: member.user.tag,
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      color: member.displayHexColor !== '#000000' ? member.displayHexColor : config.embedColor,
      fields,
      footer: `${config.botName} • User Info`,
    });

    return message.reply(replyOptions(embed));
  },
};
