const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'setjail',
  description: 'Configure the jail role and jail channel.',
  category: 'Moderation',
  usage: 'setjail <role> <#channel>',
  aliases: ['setjailrole'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const role = message.mentions.roles.first();
    const channel = message.mentions.channels.first();

    if (!role) {
      return message.reply('Usage: `setjail <@role> [#channel]`\nSets the jail role (and optionally the jail channel).');
    }

    const updates = { jail_role_id: role.id };
    if (channel) {
      updates.jail_channel_id = channel.id;
    }

    const success = await updateSettings(message.guild.id, updates);

    if (!success) {
      return message.reply('Failed to save jail settings. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Jail Configuration Set')
      .addFields(
        { name: 'Jail Role', value: `<@&${role.id}>`, inline: true }
      );

    if (channel) {
      embed.addFields({ name: 'Jail Channel', value: `<#${channel.id}>`, inline: true });
    }

    embed.setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
