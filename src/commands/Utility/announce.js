const { PermissionFlagsBits } = require('discord.js');
const { infoEmbed, successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'announce',
  description: 'Send an announcement embed to a channel.',
  category: 'Utility',
  usage: 'announce <#channel> <message>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Messages** permission to use this command.',
          })
        )
      );
    }

    const channel = message.mentions.channels.first();
    const text = args.slice(1).join(' ');

    if (!channel || !text) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'announce',
            syntax: 'announce <#channel> <message>',
            example: 'announce #general Server maintenance at 20:00',
          })
        )
      );
    }

    const embed = infoEmbed({
      title: 'Announcement',
      description: text.slice(0, 4000),
      footer: `From ${message.author.tag}`,
    });

    try {
      await channel.send(replyOptions(embed));
    } catch (error) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Announcement failed',
            description: `I could not post in <#${channel.id}>. Check my **View Channel** and **Send Messages** permissions there.`,
          })
        )
      );
    }

    return message.reply(
      replyOptions(
        successEmbed({
          title: 'Announcement sent',
          description: `Your announcement was posted in <#${channel.id}>.`,
        })
      )
    );
  },
};
