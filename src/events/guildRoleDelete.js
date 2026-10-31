const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

module.exports = {
  name: 'guildRoleDelete',
  async execute(role, client) {
    const settings = await getSettings(role.guild.id);
    if (!settings.log_role_channel_id) return;

    const logChannel = role.guild.channels.cache.get(settings.log_role_channel_id);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('❌ Role Deleted')
      .addFields(
        { name: 'Name', value: role.name, inline: false },
        { name: 'ID', value: role.id, inline: false }
      )
      .setFooter({ text: config.botName })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildRoleDelete] Failed to send log message:', err)
    );
  },
};
