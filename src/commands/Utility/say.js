const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { usageErrorEmbed, logCommandError } = require('../../utils/embedUtils');

const command = {
  name: 'say',
  description: 'Make the bot send a message in the current channel.',
  category: 'Utility',
  usage: 'say <message>',
  aliases: ['echo'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return fail('You need the **Manage Messages** permission to use this command.', 'Missing permission');
    }

    const text = args.join(' ');
    if (!text) {
      return fail('Provide the message you want me to send.', 'No message');
    }

    try {
      if (message.deletable) await message.delete().catch(() => {});
      await message.channel.send({ content: text, allowedMentions: { parse: [] } });
    } catch (error) {
      logCommandError('say', error);
      return fail('I could not send that message. Check my permissions in this channel.', 'Send failed');
    }

    return undefined;
  },
};

module.exports = command;
