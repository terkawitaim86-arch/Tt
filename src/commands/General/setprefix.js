const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { setPrefix, getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'setprefix',
  description: 'Change the bot prefix for this server.',
  category: 'General',
  usage: 'setprefix <new prefix>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        'You need the **Manage Server** permission to change the prefix.'
      );
    }

    const newPrefix = args[0];
    if (!newPrefix) {
      const current = message.guild
        ? await getPrefix(message.guild.id)
        : config.defaultPrefix;
      return message.reply(
        `The current prefix is \`${current}\`.\nUsage: \`${current}setprefix <new prefix>\``
      );
    }

    if (newPrefix.length > 5) {
      return message.reply('The prefix must be **5 characters or fewer**.');
    }

    const success = await setPrefix(message.guild.id, newPrefix);
    if (!success) {
      return message.reply('Failed to save the new prefix. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('✅ Prefix Updated')
      .setDescription(`The server prefix is now \`${newPrefix}\``)
      .setFooter({ text: config.botName })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
