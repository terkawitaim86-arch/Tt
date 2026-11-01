const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, LIMITS, createBaseEmbed, inlineCode, truncate } = require('../utils/embedUtils');

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

    const fields = [{ name: 'Role', value: `${inlineCode(newRole.id)} (${truncate(newRole.name, 64)})`, inline: false }];

    if (oldRole.name !== newRole.name) {
      fields.push(
        { name: 'Name (Before)', value: truncate(oldRole.name, LIMITS.fieldValue), inline: true },
        { name: 'Name (After)', value: truncate(newRole.name, LIMITS.fieldValue), inline: true }
      );
    }

    if (oldColor !== newColor) {
      fields.push(
        { name: 'Color (Before)', value: oldColor, inline: true },
        { name: 'Color (After)', value: newColor, inline: true }
      );
    }

    const embed = createBaseEmbed({
      title: 'Role Updated',
      color: COLORS.info,
      footerContext: FOOTER_CONTEXT.log,
      fields,
    });

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildRoleUpdate] Failed to send log message:', err)
    );
  },
};
