const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { setPrefix, getPrefix } = require('../../utils/prefixManager');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'setprefix',
  description: 'Change the bot prefix for this server.',
  category: 'General',
  usage: 'setprefix <new prefix>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Server** permission to change the prefix.',
          })
        )
      );
    }

    const newPrefix = args[0];
    if (!newPrefix) {
      const current = message.guild
        ? await getPrefix(message.guild.id)
        : config.defaultPrefix;
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'setprefix',
            syntax: `${current}setprefix <new prefix>`,
            example: `${current}setprefix !`,
            description: `The current prefix is \`${current}\`.`,
          })
        )
      );
    }

    if (newPrefix.length > 5) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Prefix too long',
            description: 'The prefix must be **5 characters or fewer**.',
          })
        )
      );
    }

    const success = await setPrefix(message.guild.id, newPrefix);
    if (!success) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Prefix not saved',
            description: 'Failed to save the new prefix. Please try again.',
          })
        )
      );
    }

    const embed = successEmbed({
      title: '✅ Prefix Updated',
      description: `The server prefix is now \`${newPrefix}\``,
      footer: config.botName,
    });

    return message.reply(replyOptions(embed));
  },
};
