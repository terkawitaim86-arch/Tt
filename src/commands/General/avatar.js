const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'avatar',
  description: 'Shows a member\'s avatar.',
  category: 'General',
  usage: 'avatar [@user]',
  aliases: ['av', 'pfp'],
  async execute(message, args, client) {
    const member = message.mentions.members.first() || message.member;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`${member.user.tag}'s Avatar`)
      .setImage(member.user.displayAvatarURL({ size: 512 }))
      .setFooter({ text: `${config.botName}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
