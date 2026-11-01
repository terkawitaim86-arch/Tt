const { infoEmbed } = require('../../utils/embedUtils');

const command = {
  name: 'avatar',
  description: "Shows a member's avatar.",
  category: 'General',
  usage: 'avatar [@user]',
  aliases: ['av', 'pfp'],
  async execute(message, args, client) {
    const member = message.mentions.members.first() || message.member;

    return message.reply({
      embeds: [
        infoEmbed({
          title: `${member.user.username}'s avatar`,
          description: `Requested by ${message.author} · [Open original](${member.user.displayAvatarURL({ size: 1024 })})`,
          image: member.user.displayAvatarURL({ size: 512 }),
          footerContext: 'Avatar',
        }),
      ],
    });
  },
};

module.exports = command;
