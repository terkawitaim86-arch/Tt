const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { infoEmbed, usageErrorEmbed, logCommandError, createBaseEmbed, COLORS } = require('../../utils/embedUtils');

const command = {
  name: 'firstmessage',
  description: 'Find the first message ever sent in a channel.',
  category: 'Utility',
  usage: 'firstmessage [#channel]',
  aliases: ['firstmsg'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const channel = message.mentions.channels.first() || message.channel;

    try {
      const messages = await channel.messages.fetch({ after: '0', limit: 1 });
      const firstMsg = messages.first();

      if (!firstMsg) {
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'No messages found',
              description: `There are no messages I can read in <#${channel.id}>.`,
              color: COLORS.warning,
              footerContext: 'First message',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          infoEmbed({
            title: 'First message',
            description: `The earliest readable message in <#${channel.id}>.`,
            fields: [
              { name: 'Author', value: `${firstMsg.author} (${firstMsg.author.tag})`, inline: false },
              { name: 'Sent', value: `<t:${Math.floor(firstMsg.createdTimestamp / 1000)}:R>`, inline: true },
              { name: 'Jump', value: `[Open message](https://discord.com/channels/${message.guild.id}/${channel.id}/${firstMsg.id})`, inline: true },
              { name: 'Content', value: firstMsg.content ? firstMsg.content.slice(0, 1024) : 'No text content', inline: false },
            ],
            footerContext: 'First message',
          }),
        ],
      });
    } catch (error) {
      logCommandError('firstmessage', error);
      return message.reply({ embeds: [usageErrorEmbed(command, prefix, `I could not read the history of <#${channel.id}>.`, { title: 'History unavailable' })] });
    }
  },
};

module.exports = command;
