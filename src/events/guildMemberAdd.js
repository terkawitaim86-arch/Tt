const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

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
        const messageText = fill(settings.welcome_message);

        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle(`Welcome to ${member.guild.name}!`)
          .setDescription(messageText)
          .addFields(
            { name: 'Members', value: `${member.guild.memberCount}`, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setTimestamp();

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
        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle('👋 Member Joined')
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: 'Member', value: `${member.user.tag} (<@${member.id}>)`, inline: false },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: false },
            { name: 'Member Count', value: `${member.guild.memberCount}`, inline: false }
          )
          .setFooter({ text: config.botName })
          .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberAdd] Failed to send log message:', err)
        );
      }
    }
  },
};
