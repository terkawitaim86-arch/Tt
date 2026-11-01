const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { updateSettings } = require('../../utils/guildSettings');
const { getPrefix } = require('../../utils/prefixManager');
const { successEmbed, usageErrorEmbed, logCommandError, createBaseEmbed, codeBlock, COLORS } = require('../../utils/embedUtils');

const DEFAULT_MESSAGE = "**{user}** has left **{server}**. We'll miss you!";

const command = {
  name: 'setgoodbye',
  description: 'Set the goodbye channel and message.',
  category: 'Welcome',
  usage: 'setgoodbye <#channel> [message]',
  aliases: [],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const channel = message.mentions.channels.first();
    const msgText = args.slice(1).join(' ').trim();

    if (!channel) {
      return fail('Mention the channel that should receive goodbye messages.', 'No channel mentioned');
    }

    const message_ = msgText || DEFAULT_MESSAGE;

    try {
      const success = await updateSettings(message.guild.id, {
        goodbye_channel_id: channel.id,
        goodbye_message: message_,
      });

      if (!success) {
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'Goodbye settings not saved',
              description: 'The goodbye settings could not be saved. Please try again.',
              color: COLORS.error,
              footerContext: 'Welcome',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Goodbye system set',
            description: `Departing members will be announced in <#${channel.id}>.`,
            fields: [
              { name: 'Message', value: codeBlock(message_), inline: false },
              { name: 'Placeholders', value: '`{user}`, `{server}`, `{count}`', inline: false },
            ],
            footerContext: 'Welcome',
          }),
        ],
      });
    } catch (error) {
      logCommandError('setgoodbye', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Goodbye settings not saved',
            description: 'The goodbye settings could not be saved. Please try again.',
            color: COLORS.error,
            footerContext: 'Welcome',
          }),
        ],
      });
    }
  },
};

module.exports = command;
