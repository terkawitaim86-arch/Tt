const config = require('../../config');
const { infoEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber } = require('../../utils/format');

module.exports = {
  name: 'roleinfo',
  description: 'Shows information about a role.',
  category: 'Utility',
  usage: 'roleinfo <@role>',
  aliases: ['role'],
  async execute(message, args, client) {
    const role = message.mentions.roles.first();

    if (!role) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'roleinfo',
            syntax: 'roleinfo <@role>',
            example: 'roleinfo @Member',
            description: 'Mention the role you want information about.',
          })
        )
      );
    }

    const embed = infoEmbed({
      title: `Role: ${role.name}`,
      color: role.color || config.embedColor,
      fields: [
        { name: 'ID', value: role.id, inline: true },
        { name: 'Members', value: formatNumber(role.members.size), inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        {
          name: 'Color',
          value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Default',
          inline: true,
        },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
      ],
      footer: 'ZMB • Role Info',
    });

    return message.reply(replyOptions(embed));
  },
};
