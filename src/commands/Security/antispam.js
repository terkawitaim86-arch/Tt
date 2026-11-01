const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { infoEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'antispam',
  description: 'Removed: anti-spam protection has been disabled for this bot.',
  category: 'Security',
  usage: 'antispam',
  aliases: ['spamconfig'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Server** permission to use this command.',
          })
        )
      );
    }

    const embed = infoEmbed({
      title: 'Anti-Spam Removed',
      description: 'Anti-spam protection has been disabled for ZMB and is no longer enforced.',
      fields: [
        { name: 'Status', value: 'Disabled', inline: true },
        { name: 'Configuration', value: 'No longer used', inline: true },
        { name: 'Note', value: 'This command is kept only as a compatibility stub.', inline: false },
      ],
      footer: `${config.botName} • Deprecated feature`,
    });

    return message.reply(replyOptions(embed));
  },
};
