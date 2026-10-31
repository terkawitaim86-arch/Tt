const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

module.exports = {
  name: 'guildRoleCreate',
  async execute(role, client) {
    const settings = await getSettings(role.guild.id);
    if (!settings.log_role_channel_id) return;

    const logChannel = role.guild.channels.cache.get(settings.log_role_channel_id);
    if (!logChannel) return;

    const permissions = new PermissionsBitField(role.permissions).toArray().join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('✅ Role Created')
      .addFields(
        { name: 'Name', value: role.name, inline: false },
        { name: 'ID', value: role.id, inline: false },
        { name: 'Color', value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Default', inline: false },
        { name: 'Permissions', value: permissions, inline: false }
      )
      .setFooter({ text: config.botName })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildRoleCreate] Failed to send log message:', err)
    );
  },
};
