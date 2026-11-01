const { infoEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

module.exports = {
  name: 'poll',
  description: 'Create a poll with up to 9 options.',
  category: 'Utility',
  usage: 'poll <question> | <option1> | <option2> [| option3...]',
  aliases: [],
  async execute(message, args, client) {
    const fullText = args.join(' ');

    if (!fullText) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'poll',
            syntax: 'poll <question> | <option1> | <option2> [| option3...]',
            example: 'poll Best map? | Dust II | Mirage | Inferno',
            description: 'You need at least a question and 2 options.',
          })
        )
      );
    }

    const parts = fullText.split('|').map((p) => p.trim()).filter(Boolean);

    if (parts.length < 3) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'poll',
            syntax: 'poll <question> | <option1> | <option2> [| option3...]',
            example: 'poll Best map? | Dust II | Mirage | Inferno',
            description: 'You need at least a question and 2 options.',
          })
        )
      );
    }

    if (parts.length > 10) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Too many options',
            description: 'You can only have up to 9 options.',
          })
        )
      );
    }

    const question = parts[0];
    const options = parts.slice(1);

    const embed = infoEmbed({
      title: 'Poll',
      description: `**${question.slice(0, 2000)}**`,
      fields: options.map((opt, i) => ({
        name: `${EMOJIS[i]} ${opt.slice(0, 256)}`,
        value: '\u200B',
        inline: false,
      })),
      footer: `Poll by ${message.author.tag}`,
    });

    let pollMessage;
    try {
      pollMessage = await message.channel.send(replyOptions(embed));
    } catch (error) {
      console.error('[poll] send failed:', error?.message || error);
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Poll failed',
            description: 'I could not post the poll in this channel. Check my **Send Messages** permission.',
          })
        )
      );
    }

    let failedReactions = 0;
    for (let i = 0; i < options.length; i++) {
      try {
        await pollMessage.react(EMOJIS[i]);
      } catch (error) {
        failedReactions += 1;
      }
    }

    if (message.deletable) message.delete().catch(() => {});

    if (failedReactions > 0) {
      console.warn(`[poll] ${failedReactions} reaction(s) could not be added in guild ${message.guild.id}`);
    }
  },
};
