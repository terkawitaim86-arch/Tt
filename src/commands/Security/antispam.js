const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { warningEmbed, usageErrorEmbed } = require('../../utils/embedUtils');

const command = {
  name: 'antispam',
  description: 'Removed: anti-spam protection has been disabled for this bot.',
  category: 'Security',
  usage: 'antispam',
  aliases: ['spamconfig'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        embeds: [
          usageErrorEmbed(command, prefix, 'You need the **Manage Server** permission to use this command.', {
            title: 'Missing permission',
          }),
        ],
      });
    }

    return message.reply({
      embeds: [
        warningEmbed({
          title: 'Anti-spam has been removed',
          description: 'Anti-spam protection is disabled and no longer enforced by this bot.',
          fields: [
            { name: 'Status', value: 'Disabled', inline: true },
            { name: 'Configuration', value: 'No longer used', inline: true },
          ],
          footerContext: 'Deprecated command',
        }),
      ],
    });
  },
};

module.exports = command;
