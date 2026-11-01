const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, LIMITS, createBaseEmbed, inlineCode, truncate } = require('../utils/embedUtils');

module.exports = {
  name: 'guildRoleDelete',
  async execute(role, client) {
    const settings = await getSettings(role.guild.id);
    if (!settings.log_role_channel_id) return;

    const logChannel = role.guild.channels.cache.get(settings.log_role_channel_id);
    if (!logChannel) return;

    const embed = createBaseEmbed({
      title: 'Role Deleted',
      description: `${inlineCode(role.id)} was deleted from this server.`,
      color: COLORS.error,
      footerContext: FOOTER_CONTEXT.log,
      fields: [
        { name: 'Name', value: truncate(role.name, LIMITS.fieldValue), inline: false },
        { name: 'ID', value: inlineCode(role.id), inline: false },
      ],
    });

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildRoleDelete] Failed to send log message:', err)
    );
  },
};
