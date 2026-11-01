const { getSettings } = require('../utils/guildSettings');
const { COLORS, FOOTER_CONTEXT, LIMITS, createBaseEmbed, inlineCode, truncate } = require('../utils/embedUtils');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const settings = await getSettings(newMessage.guild?.id);
    if (!settings.log_chat_channel_id) return;

    const logChannel = newMessage.guild.channels.cache.get(settings.log_chat_channel_id);
    if (!logChannel) return;

    const messageLink = `https://discord.com/channels/${newMessage.guild.id}/${newMessage.channelId}/${newMessage.id}`;

    const embed = createBaseEmbed({
      title: 'Message Edited',
      description: `[Jump to message](${messageLink})`,
      color: COLORS.info,
      footerContext: FOOTER_CONTEXT.log,
      fields: [
        {
          name: 'Author',
          value: `${inlineCode(newMessage.author.id)} (${newMessage.author.tag})`,
          inline: false,
        },
        { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
        { name: 'Before', value: truncate(oldMessage.content || 'No content', LIMITS.fieldValue), inline: false },
        { name: 'After', value: truncate(newMessage.content || 'No content', LIMITS.fieldValue), inline: false },
      ],
    });

    // Show when the message was edited, falling back to when it was sent.
    embed.setTimestamp(newMessage.editedTimestamp || newMessage.createdTimestamp);

    logChannel.send({ embeds: [embed] }).catch((err) =>
      console.error('[messageUpdate] Failed to send log message:', err)
    );
  },
};
