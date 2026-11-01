const { getSettings } = require('../utils/guildSettings');
const { logAction } = require('../utils/modLog');
const { COLORS, FOOTER_CONTEXT, createBaseEmbed, inlineCode, sanitizeReason } = require('../utils/embedUtils');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const { guild, user } = ban;

    const settings = await getSettings(guild.id);

    // Resolve the responsible moderator from the audit log (may be unavailable).
    let executor = null;
    let auditReason = null;
    try {
      const auditLogs = await guild.fetchAuditLogs({ type: 22, limit: 1 }); // 22 = MEMBER_BAN_ADD
      const entry = auditLogs.entries.first();
      if (entry && entry.target?.id === user.id) {
        executor = entry.executor || null;
        auditReason = entry.reason || null;

        if (entry.executor?.id !== client.user.id) {
          await logAction({
            guildId: guild.id,
            action: 'ban',
            targetId: user.id,
            moderatorId: entry.executor.id,
            reason: auditReason,
          });
        }
      }
    } catch (err) {
      console.error('[guildBanAdd] Failed to fetch audit logs:', err);
    }

    if (!settings.log_server_channel_id) return;

    const logChannel = guild.channels.cache.get(settings.log_server_channel_id);
    if (!logChannel) return;

    const embed = createBaseEmbed({
      title: 'Member Banned',
      description: `${inlineCode(user.id)} (${user.tag}) was banned from the server.`,
      color: COLORS.moderation,
      footerContext: FOOTER_CONTEXT.moderation,
      thumbnail: user.displayAvatarURL({ size: 256 }),
      fields: [
        { name: 'Target', value: `${inlineCode(user.id)} (${user.tag})`, inline: false },
        { name: 'Moderator', value: executor ? `${inlineCode(executor.id)} (${executor.tag})` : 'Unknown', inline: false },
        { name: 'Reason', value: sanitizeReason(auditReason), inline: false },
      ],
    });

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildBanAdd] Failed to send log message:', err)
    );
  },
};
