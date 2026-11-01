const config = require('../../config');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'avatar',
  description: "Shows a member's avatar.",
  category: 'General',
  usage: 'avatar [@user]',
  aliases: ['av', 'pfp'],
  async execute(message, args, client) {
    const member = message.mentions.members.first() || message.member;

    const embed = infoEmbed({
      title: `${member.user.tag}'s Avatar`,
      description: `[Download full size](${member.user.displayAvatarURL({ size: 1024 })})`,
      image: member.user.displayAvatarURL({ size: 512 }),
      footer: config.botName,
    });

    return message.reply(replyOptions(embed));
  },
};
