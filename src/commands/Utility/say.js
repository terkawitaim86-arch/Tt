const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, missingBotPermissions, textChannelOnly, describeDiscordError } = require('../../utils/permissions');
const { errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'say',
  description: 'Make the bot send a message in the current channel.',
  category: 'Utility',
  usage: 'say <message>',
  aliases: ['echo'],
  async execute(message, args, client) {
    if (!hasPermission(message.member, PermissionFlagsBits.ManageMessages)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Messages** permission to use this command.',
          })
        )
      );
    }

    const channelProblem = textChannelOnly(message.channel);
    if (channelProblem) {
      return message.reply(replyOptions(errorEmbed({ description: channelProblem })));
    }

    const missing = missingBotPermissions(message.guild, [PermissionFlagsBits.SendMessages]);
    if (missing) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing bot permission',
            description: `I need the **${missing}** permission to send messages here.`,
          })
        )
      );
    }

    const text = args.join(' ').trim();
    if (!text) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'say',
            syntax: 'say <message>',
            example: 'say Welcome to ZMB OFFICIAL!',
          })
        )
      );
    }

    try {
      if (message.deletable) {
        await message.delete().catch(() => {});
      }
      return await message.channel.send({ content: text, allowedMentions: { parse: [] } });
    } catch (error) {
      console.error('[say] Failed to send message:', error.message);
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Message not sent',
            description: describeDiscordError(error, 'Discord rejected the message.'),
          })
        )
      );
    }
  },
};
EOF'
node --check src/commands/Utility/say.js && echo SAY_OK
