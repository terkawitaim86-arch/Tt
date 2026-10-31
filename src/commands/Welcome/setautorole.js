const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'setautorole',
  description: 'Set a role automatically given to new members.',
  category: 'Welcome',
  usage: 'setautorole <@role>',
  aliases: ['autorole'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply('Usage: `setautorole <@role>`');
    }

    const success = await updateSettings(message.guild.id, { auto_role_id: role.id });

    if (!success) {
      return message.reply('Failed to save auto role. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Auto Role Set')
      .addFields(
        { name: 'Role', value: `<@&${role.id}>`, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
