const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { infoEmbed, usageErrorEmbed, normalizeColor } = require('../../utils/embedUtils');

const command = {
  name: 'roleinfo',
  description: 'Shows information about a role.',
  category: 'Utility',
  usage: 'roleinfo <@role>',
  aliases: ['role'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const role = message.mentions.roles.first();

    if (!role) {
      return message.reply({
        embeds: [usageErrorEmbed(command, prefix, 'Mention the role you want information about.', { title: 'No role provided' })],
      });
    }

    const colorHex = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Default';

    return message.reply({
      embeds: [
        infoEmbed({
          title: `Role: ${role.name}`,
          description: 'Role information.',
          color: role.color ? normalizeColor(role.color) : undefined,
          fields: [
            { name: 'Role ID', value: `\`${role.id}\``, inline: true },
            { name: 'Members', value: String(role.members.size), inline: true },
            { name: 'Position', value: String(role.position), inline: true },
            { name: 'Color', value: colorHex, inline: true },
            { name: 'Displayed separately', value: role.hoist ? 'Yes' : 'No', inline: true },
            { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
            { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Managed by integration', value: role.managed ? 'Yes' : 'No', inline: true },
          ],
          footerContext: 'Role information',
        }),
      ],
    });
  },
};

module.exports = command;
