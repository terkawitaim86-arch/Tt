const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

module.exports = {
  name: 'guildRoleUpdate',
  async execute(oldRole, newRole, client) {
    if (oldRole.name === newRole.name && oldRole.color === newRole.color) return;

    const settings = await getSettings(newRole.guild.id);
    if (!settings.log_role_channel_id) return;

    const logChannel = newRole.guild.channels.cache.get(settings.log_role_channel_id);
    if (!logChannel) return;

    const oldColor = oldRole.color ? `#${oldRole.color.toString(16).padStart(6, '0')}` : 'Default';
    const newColor = newRole.color ? `#${newRole.color.toString(16).padStart(6, '0')}` : 'Default';

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📝 Role Updated')
      .addFields(
        { name: 'Name (Before)', value: oldRole.name, inline: true },
        { name: 'Name (After)', value: newRole.name, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Color (Before)', value: oldColor, inline: true },
        { name: 'Color (After)', value: newColor, inline: true }
      )
      .setFooter({ text: config.botName })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildRoleUpdate] Failed to send log message:', err)
    );
  },
};
