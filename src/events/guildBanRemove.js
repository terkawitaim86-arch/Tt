const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban, client) {
    const { guild, user } = ban;

    const settings = await getSettings(guild.id);
    if (!settings.log_server_channel_id) return;

    const logChannel = guild.channels.cache.get(settings.log_server_channel_id);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🔓 Member Unbanned')
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'Member', value: `${user.tag} (<@${user.id}>)`, inline: false },
        { name: 'ID', value: user.id, inline: false }
      )
      .setFooter({ text: config.botName })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildBanRemove] Failed to send log message:', err)
    );
  },
};
