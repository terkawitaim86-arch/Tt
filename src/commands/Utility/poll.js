const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { createBaseEmbed, usageErrorEmbed, COLORS } = require('../../utils/embedUtils');

const POLL_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

const command = {
  name: 'poll',
  description: 'Create a poll with up to 9 options.',
  category: 'Utility',
  usage: 'poll <question> | <option1> | <option2> [| option3...]',
  aliases: [],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    const parts = args.join(' ').split('|').map((part) => part.trim()).filter(Boolean);

    if (parts.length < 3) {
      return fail('You need a question and at least two options separated by `|`.', 'Not enough options');
    }

    if (parts.length > POLL_EMOJIS.length + 1) {
      return fail('A poll can have at most 9 options.', 'Too many options');
    }

    const [question, ...options] = parts;

    const embed = createBaseEmbed({
      title: 'Poll',
      description: `**${question}**`,
      fields: options.map((option, index) => ({
        name: `${POLL_EMOJIS[index]} ${option}`,
        value: '\u200B',
        inline: false,
      })),
      footerContext: `Poll by ${message.author.tag} • ${options.length} options`,
      color: COLORS.primary,
    });

    const pollMessage = await message.channel.send({ embeds: [embed] });

    for (let index = 0; index < options.length; index += 1) {
      await pollMessage.react(POLL_EMOJIS[index]).catch(() => {});
    }

    if (message.deletable) await message.delete().catch(() => {});
    return undefined;
  },
};

module.exports = command;
