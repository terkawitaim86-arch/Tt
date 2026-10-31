const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

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

          const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📝 Nickname Changed')
            .addFields(
              { name: 'Member', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: false },
              { name: 'Before', value: oldNick, inline: true },
              { name: 'After', value: newNick, inline: true }
            )
            .setFooter({ text: config.botName })
            .setTimestamp();

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
        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle('🎭 Roles Updated')
          .addFields(
            { name: 'Member', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: false }
          );

        if (addedRoles.size > 0) {
          embed.addFields({
            name: 'Added',
            value: addedRoles.map((r) => `<@&${r.id}>`).join(', ') || 'None',
            inline: false,
          });
        }

        if (removedRoles.size > 0) {
          embed.addFields({
            name: 'Removed',
            value: removedRoles.map((r) => `<@&${r.id}>`).join(', ') || 'None',
            inline: false,
          });
        }

        embed.setFooter({ text: config.botName }).setTimestamp();

        logChannel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberUpdate] Failed to send role log:', err)
        );
      }
    }
  },
};
