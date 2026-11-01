const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, createBaseEmbed, inlineCode } = require('../utils/embedUtils');

const DEFAULT_GOODBYE = 'Goodbye {user}, we will miss you!';

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    if (member.user?.bot) return;

    const settings = await getSettings(member.guild.id);

    const replacements = {
      '{user}': `<@${member.id}>`,
      '{server}': member.guild.name,
      '{count}': member.guild.memberCount,
    };

    const fill = (text) =>
      text
        .replace(/\{user\}/g, replacements['{user}'])
        .replace(/\{server\}/g, replacements['{server}'])
        .replace(/\{count\}/g, replacements['{count}']);

    // Goodbye message + embed
    if (settings.goodbye_channel_id) {
      const channel = member.guild.channels.cache.get(settings.goodbye_channel_id);
      if (channel) {
        const messageText = fill(settings.goodbye_message || DEFAULT_GOODBYE);

        const embed = createBaseEmbed({
          title: `Goodbye from ${member.guild.name}!`,
          description: messageText,
          color: COLORS.warning,
          footerContext: FOOTER_CONTEXT.info,
          thumbnail: member.user?.displayAvatarURL({ size: 256 }),
          fields: [{ name: 'Members', value: `${member.guild.memberCount}`, inline: true }],
        });

        channel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberRemove] Failed to send goodbye message:', err)
        );
      }
    }

    // Server log
    if (settings.log_server_channel_id) {
      const logChannel = member.guild.channels.cache.get(settings.log_server_channel_id);
      if (logChannel) {
        const embed = createBaseEmbed({
          title: 'Member Left',
          description: `${inlineCode(member.id)} (${member.user?.tag || 'Unknown User'}) left the server.`,
          color: COLORS.neutral,
          footerContext: FOOTER_CONTEXT.log,
          thumbnail: member.user?.displayAvatarURL({ size: 256 }),
          fields: [
            {
              name: 'Member',
              value: `${inlineCode(member.id)} (${member.user?.tag || 'Unknown User'})`,
              inline: false,
            },
            { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
          ],
        });

        logChannel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberRemove] Failed to send log message:', err)
        );
      }
    }
  },
};
