const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'say',
  description: 'Make the bot send a message in the current channel.',
  category: 'Utility',
  usage: 'say <message>',
  aliases: ['echo'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('You need the **Manage Messages** permission to use this command.');
    }
    const text = args.join(' ');
    if (!text) {
      return message.reply('Usage: `say <message>`');
    }

    if (message.deletable) message.delete().catch(() => {});
    return message.channel.send({ content: text, allowedMentions: { parse: [] } });
  },
};
