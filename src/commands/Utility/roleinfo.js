const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'roleinfo',
  description: 'Shows information about a role.',
  category: 'Utility',
  usage: 'roleinfo <@role>',
  aliases: ['role'],
  async execute(message, args, client) {
    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply('Usage: `roleinfo <@role>`');
    }

    const embed = new EmbedBuilder()
      .setColor(role.color || config.embedColor)
      .setTitle(`Role: ${role.name}`)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Color', value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Default', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
