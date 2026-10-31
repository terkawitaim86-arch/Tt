const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');

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
        const messageText = fill(settings.goodbye_message);

        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle(`Goodbye from ${member.guild.name}!`)
          .setDescription(messageText)
          .addFields(
            { name: 'Members', value: `${member.guild.memberCount}`, inline: true }
          )
          .setThumbnail(member.user?.displayAvatarURL({ dynamic: true, size: 256 }))
          .setTimestamp();

        channel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberRemove] Failed to send goodbye message:', err)
        );
      }
    }

    // Server log
    if (settings.log_server_channel_id) {
      const logChannel = member.guild.channels.cache.get(settings.log_server_channel_id);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle('👋 Member Left')
          .setThumbnail(member.user?.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: 'Member', value: `${member.user?.tag || 'Unknown User'} (<@${member.id}>)`, inline: false },
            { name: 'Member Count', value: `${member.guild.memberCount}`, inline: false }
          )
          .setFooter({ text: config.botName })
          .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch((err) =>
          console.error('[guildMemberRemove] Failed to send log message:', err)
        );
      }
    }
  },
};
