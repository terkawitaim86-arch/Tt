const { infoEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'firstmessage',
  description: 'Find the first message ever sent in a channel.',
  category: 'Utility',
  usage: 'firstmessage [#channel]',
  aliases: ['firstmsg'],
  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;

    try {
      const messages = await channel.messages.fetch({ after: '0', limit: 1 });
      const firstMsg = messages.first();

      if (!firstMsg) {
        return message.reply(
          replyOptions(
            errorEmbed({
              title: 'No messages found',
              description: `I could not find any messages in <#${channel.id}>.`,
            })
          )
        );
      }

      const embed = infoEmbed({
        title: 'First Message',
        fields: [
          { name: 'Author', value: `<@${firstMsg.author.id}> (${firstMsg.author.tag})`, inline: false },
          { name: 'Sent', value: `<t:${Math.floor(firstMsg.createdTimestamp / 1000)}:R>`, inline: false },
          {
            name: 'Content',
            value: firstMsg.content ? firstMsg.content.slice(0, 1024) : 'No text content',
            inline: false,
          },
          {
            name: 'Jump',
            value: `[Click here](https://discord.com/channels/${message.guild.id}/${channel.id}/${firstMsg.id})`,
            inline: false,
          },
        ],
        footer: `ZMB • #${channel.name}`,
      });

      return message.reply(replyOptions(embed));
    } catch (error) {
      console.error('[firstmessage] Failed:', error?.message || error);
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Lookup failed',
            description: 'Failed to fetch the first message. Please try again.',
          })
        )
      );
    }
  },
};
