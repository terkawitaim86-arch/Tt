const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, LIMITS, createBaseEmbed, inlineCode, truncate } = require('../utils/embedUtils');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (message.partial || message.author?.bot) return;

    const settings = await getSettings(message.guild?.id);
    if (!settings.log_chat_channel_id) return;

    const logChannel = message.guild.channels.cache.get(settings.log_chat_channel_id);
    if (!logChannel) return;

    const embed = createBaseEmbed({
      title: 'Message Deleted',
      color: COLORS.warning,
      footerContext: FOOTER_CONTEXT.log,
      fields: [
        {
          name: 'Author',
          value: `${inlineCode(message.author.id)} (${message.author.tag})`,
          inline: false,
        },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: false },
        {
          name: 'Content',
          value: truncate(message.content || 'No content', LIMITS.fieldValue),
          inline: false,
        },
      ],
    });

    // Keep the original message creation time rather than the log time.
    embed.setTimestamp(message.createdTimestamp);

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[messageDelete] Failed to send log message:', err)
    );
  },
};
