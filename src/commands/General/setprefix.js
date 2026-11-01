const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { setPrefix, getPrefix } = require('../../utils/prefixManager');
const { successEmbed, usageErrorEmbed, inlineCode } = require('../../utils/embedUtils');

const command = {
  name: 'setprefix',
  description: 'Change the bot prefix for this server.',
  category: 'General',
  usage: 'setprefix <new prefix>',
  aliases: [],
  async execute(message, args, client) {
    const current = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, current, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to change the prefix.', 'Missing permission');
    }

    const newPrefix = args[0];
    if (!newPrefix) {
      return fail(`The current prefix is ${inlineCode(current)}.`, 'Current prefix');
    }

    if (newPrefix.length > 5) {
      return fail('The prefix must be **5 characters or fewer**.', 'Invalid prefix');
    }

    const success = await setPrefix(message.guild.id, newPrefix);
    if (!success) {
      return fail('I could not save the new prefix. Please try again.', 'Save failed');
    }

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Prefix updated',
          description: `Commands in **${message.guild.name}** now start with ${inlineCode(newPrefix)}.`,
          fields: [{ name: 'Example', value: `${newPrefix}help`, inline: false }],
          footerContext: 'Prefix',
        }),
      ],
    });
  },
};

module.exports = command;
