const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');
const { logAction } = require('../utils/modLog');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const { guild, user } = ban;

    const settings = await getSettings(guild.id);

    // Server log embed
    if (settings.log_server_channel_id) {
      const logChannel = guild.channels.cache.get(settings.log_server_channel_id);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle('🔨 Member Banned')
          .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: 'Member', value: `${user.tag} (<@${user.id}>)`, inline: false },
            { name: 'ID', value: user.id, inline: false }
          )
          .setFooter({ text: config.botName })
          .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildBanAdd] Failed to send log message:', err)
        );
      }
    }

    // Record in moderation_logs if it wasn't done by the bot
    try {
      const auditLogs = await guild.fetchAuditLogs({ type: 22, limit: 1 }); // 22 = MEMBER_BAN_ADD
      const entry = auditLogs.entries.first();
      if (entry && entry.target?.id === user.id && entry.executor?.id !== client.user.id) {
        await logAction({
          guildId: guild.id,
          action: 'ban',
          targetId: user.id,
          moderatorId: entry.executor.id,
          reason: entry.reason || null,
        });
      }
    } catch (err) {
      console.error('[guildBanAdd] Failed to fetch audit logs:', err);
    }
  },
};
