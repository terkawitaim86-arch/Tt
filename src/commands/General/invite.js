const { infoEmbed, BRAND } = require('../../utils/embedUtils');

const command = {
  name: 'invite',
  description: "Get the bot's invite link.",
  category: 'General',
  usage: 'invite',
  aliases: [],
  async execute(message, args, client) {
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

    return message.reply({
      embeds: [
        infoEmbed({
          title: `Invite ${BRAND}`,
          description: `[Add ${BRAND} to your server](${inviteLink})`,
          thumbnail: client.user.displayAvatarURL({ size: 256 }),
          footerContext: 'Invite',
        }),
      ],
    });
  },
};

module.exports = command;
