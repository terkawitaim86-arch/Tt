const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

module.exports = {
  name: 'guildBanRemove',

  async execute(ban, client) {
    try {
      const { guild, user } = ban;

      if (!guild || !user) return;

      const settings = await getSettings(guild.id);

      if (!settings?.log_server_channel_id) return;

      const logChannel = guild.channels.cache.get(
        settings.log_server_channel_id
      );

      if (!logChannel || !logChannel.isTextBased()) return;

      const permissions = logChannel.permissionsFor(client.user);

      if (
        !permissions?.has(PermissionFlagsBits.ViewChannel) ||
        !permissions?.has(PermissionFlagsBits.SendMessages) ||
        !permissions?.has(PermissionFlagsBits.EmbedLinks)
      ) {
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🔓 Member Unbanned')
        .setThumbnail(
          user.displayAvatarURL({ size: 256 })
        )
        .addFields(
          {
            name: 'Member',
            value: `${user.tag || user.username} (<@${user.id}>)`,
            inline: false,
          },
          {
            name: 'ID',
            value: user.id,
            inline: false,
          }
        )
        .setFooter({ text: config.botName })
        .setTimestamp();

      await logChannel.send({
        embeds: [embed],
        allowedMentions: { parse: [] },
      });

    } catch (error) {
      console.error(
        '[guildBanRemove] Failed to process unban log:',
        error
      );
    }
  },
};