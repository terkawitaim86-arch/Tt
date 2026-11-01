const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, createBaseEmbed, inlineCode } = require('../utils/embedUtils');

const DEFAULT_WELCOME = 'Welcome to {server}, {user}!';

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    if (member.user.bot) return;

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

    // Welcome message + embed
    if (settings.welcome_channel_id) {
      const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
      if (channel) {
        const messageText = fill(settings.welcome_message || DEFAULT_WELCOME);

        const embed = createBaseEmbed({
          title: `Welcome to ${member.guild.name}!`,
          description: messageText,
          color: COLORS.success,
          footerContext: FOOTER_CONTEXT.info,
          thumbnail: member.user.displayAvatarURL({ size: 256 }),
          fields: [{ name: 'Members', value: `${member.guild.memberCount}`, inline: true }],
        });

        channel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberAdd] Failed to send welcome message:', err)
        );
      }
    }

    // Auto role
    if (settings.auto_role_id) {
      const role = member.guild.roles.cache.get(settings.auto_role_id);
      if (role) {
        member.roles.add(role).catch((err) =>
          console.error('[guildMemberAdd] Failed to assign auto role:', err)
        );
      }
    }

    // Server log
    if (settings.log_server_channel_id) {
      const logChannel = member.guild.channels.cache.get(settings.log_server_channel_id);
      if (logChannel) {
        const embed = createBaseEmbed({
          title: 'Member Joined',
          description: `${inlineCode(member.id)} (${member.user.tag}) joined the server.`,
          color: COLORS.success,
          footerContext: FOOTER_CONTEXT.log,
          thumbnail: member.user.displayAvatarURL({ size: 256 }),
          fields: [
            { name: 'Member', value: `${inlineCode(member.id)} (${member.user.tag})`, inline: false },
            {
              name: 'Account Created',
              value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
              inline: true,
            },
            { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
          ],
        });

        logChannel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberAdd] Failed to send log message:', err)
        );
      }
    }
  },
};
