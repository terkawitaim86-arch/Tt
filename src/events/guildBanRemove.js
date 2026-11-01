const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, createBaseEmbed, inlineCode, sanitizeReason } = require('../utils/embedUtils');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban, client) {
    const { guild, user } = ban;

    const settings = await getSettings(guild.id);
    if (!settings.log_server_channel_id) return;

    const logChannel = guild.channels.cache.get(settings.log_server_channel_id);
    if (!logChannel) return;

    // Resolve the responsible moderator from the audit log (may be unavailable).
    let executor = null;
    let auditReason = null;
    try {
      const auditLogs = await guild.fetchAuditLogs({ type: 23, limit: 1 }); // 23 = MEMBER_BAN_REMOVE
      const entry = auditLogs.entries.first();
      if (entry && entry.target?.id === user.id) {
        executor = entry.executor || null;
        auditReason = entry.reason || null;
      }
    } catch (err) {
      console.error('[guildBanRemove] Failed to fetch audit logs:', err);
    }

    const embed = createBaseEmbed({
      title: 'Member Unbanned',
      description: `${inlineCode(user.id)} (${user.tag}) was unbanned from the server.`,
      color: COLORS.success,
      footerContext: FOOTER_CONTEXT.moderation,
      thumbnail: user.displayAvatarURL({ size: 256 }),
      fields: [
        { name: 'Target', value: `${inlineCode(user.id)} (${user.tag})`, inline: false },
        { name: 'Moderator', value: executor ? `${inlineCode(executor.id)} (${executor.tag})` : 'Unknown', inline: false },
        { name: 'Reason', value: sanitizeReason(auditReason), inline: false },
      ],
    });

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildBanRemove] Failed to send log message:', err)
    );
  },
};
