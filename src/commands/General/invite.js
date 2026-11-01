const config = require('../../config');
const { infoEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'invite',
  description: "Get the bot's invite link.",
  category: 'General',
  usage: 'invite',
  aliases: [],
  async execute(message, args, client) {
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

    const embed = infoEmbed({
      title: `Invite ${config.botName}`,
      description: `[Click here to invite me to your server](${inviteLink})`,
      thumbnail: client.user.displayAvatarURL({ size: 256 }),
      footer: `${config.botName} • Invite`,
    });

    return message.reply(replyOptions(embed));
  },
};
