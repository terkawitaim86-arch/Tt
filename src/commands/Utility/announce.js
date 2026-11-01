const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const {
  createBaseEmbed,
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  COLORS,
  FOOTER_CONTEXT,
} = require('../../utils/embedUtils');

const command = {
  name: 'announce',
  description: 'Send an announcement embed to a channel.',
  category: 'Utility',
  usage: 'announce <#channel> <message>',
  aliases: [],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return fail('You need the **Manage Messages** permission to use this command.', 'Missing permission');
    }

    const channel = message.mentions.channels.first();
    const text = args.slice(1).join(' ');

    if (!channel || !text) {
      return fail('Provide a target channel and the announcement text.', 'Invalid arguments');
    }

    try {
      await channel.send({
        embeds: [
          createBaseEmbed({
            title: 'Announcement',
            description: text,
            author: { name: message.guild.name, iconURL: message.guild.iconURL({ size: 128 }) ?? undefined },
            footerContext: `Announced by ${message.author.tag}`,
          }),
        ],
      });
    } catch (error) {
      logCommandError('announce', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Announcement failed',
            description: `I could not post in <#${channel.id}>. Check my permissions there and try again.`,
            color: COLORS.error,
            footerContext: FOOTER_CONTEXT.error,
          }),
        ],
      });
    }

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Announcement sent',
          description: `Your announcement was posted in <#${channel.id}>.`,
          footerContext: 'Announcement',
        }),
      ],
    });
  },
};

module.exports = command;
