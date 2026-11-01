const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, LIMITS, createBaseEmbed, inlineCode, truncate } = require('../utils/embedUtils');

/** Render role pings, collapsing long lists so the embed stays within limits. */
function formatRoles(collection) {
  const roles = collection.map((role) => `<@&${role.id}>`);
  if (roles.length <= 15) return roles.join(', ') || 'None';

  const shown = roles.slice(0, 15).join(', ');
  return `${shown} (+${roles.length - 15} more)`;
}

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    if (oldMember.partial || newMember.partial) return;

    const settings = await getSettings(newMember.guild.id);

    // Nickname changes
    if (oldMember.nickname !== newMember.nickname) {
      if (settings.log_server_channel_id) {
        const logChannel = newMember.guild.channels.cache.get(settings.log_server_channel_id);
        if (logChannel) {
          const oldNick = oldMember.nickname || oldMember.user.username;
          const newNick = newMember.nickname || newMember.user.username;

          const embed = createBaseEmbed({
            title: 'Nickname Changed',
            description: `${inlineCode(newMember.id)} (${newMember.user.tag}) had their nickname updated.`,
            color: COLORS.info,
            footerContext: FOOTER_CONTEXT.log,
            fields: [
              { name: 'Member', value: `${inlineCode(newMember.id)} (${newMember.user.tag})`, inline: false },
              { name: 'Before', value: truncate(oldNick, LIMITS.fieldValue), inline: true },
              { name: 'After', value: truncate(newNick, LIMITS.fieldValue), inline: true },
            ],
          });

          logChannel.send({ embeds: [embed] }).catch((err) =>
            console.error('[guildMemberUpdate] Failed to send nickname log:', err)
          );
        }
      }
    }

    // Role changes
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter((r) => !oldRoles.has(r.id));
    const removedRoles = oldRoles.filter((r) => !newRoles.has(r.id));

    if ((addedRoles.size > 0 || removedRoles.size > 0) && settings.log_role_channel_id) {
      const logChannel = newMember.guild.channels.cache.get(settings.log_role_channel_id);
      if (logChannel) {
        const fields = [
          { name: 'Member', value: `${inlineCode(newMember.id)} (${newMember.user.tag})`, inline: false },
        ];

        if (addedRoles.size > 0) {
          fields.push({ name: 'Added', value: formatRoles(addedRoles), inline: false });
        }

        if (removedRoles.size > 0) {
          fields.push({ name: 'Removed', value: formatRoles(removedRoles), inline: false });
        }

        const embed = createBaseEmbed({
          title: 'Roles Updated',
          description: `${inlineCode(newMember.id)} (${newMember.user.tag}) had their roles changed.`,
          color: COLORS.info,
          footerContext: FOOTER_CONTEXT.log,
          fields,
        });

        logChannel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberUpdate] Failed to send role log:', err)
        );
      }
    }
  },
};
