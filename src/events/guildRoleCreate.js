const { PermissionsBitField } = require('discord.js');
const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, LIMITS, createBaseEmbed, inlineCode, truncate } = require('../utils/embedUtils');

module.exports = {
  name: 'guildRoleCreate',
  async execute(role, client) {
    const settings = await getSettings(role.guild.id);
    if (!settings.log_role_channel_id) return;

    const logChannel = role.guild.channels.cache.get(settings.log_role_channel_id);
    if (!logChannel) return;

    const permissions = new PermissionsBitField(role.permissions).toArray().join(', ') || 'None';

    const embed = createBaseEmbed({
      title: 'Role Created',
      description: `${inlineCode(role.id)} was created in this server.`,
      color: COLORS.success,
      footerContext: FOOTER_CONTEXT.log,
      fields: [
        { name: 'Name', value: truncate(role.name, LIMITS.fieldValue), inline: false },
        { name: 'ID', value: inlineCode(role.id), inline: false },
        {
          name: 'Color',
          value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Default',
          inline: true,
        },
        { name: 'Permissions', value: truncate(permissions, LIMITS.fieldValue), inline: false },
      ],
    });

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildRoleCreate] Failed to send log message:', err)
    );
  },
};
