const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'poll',
  description: 'Create a poll with up to 9 options.',
  category: 'Utility',
  usage: 'poll <question> | <option1> | <option2> [| option3...]',
  aliases: [],
  async execute(message, args, client) {
    const fullText = args.join(' ');
    const parts = fullText.split('|').map((p) => p.trim());

    if (parts.length < 3) {
      return message.reply('Usage: `poll <question> | <option1> | <option2> [| option3...]`\nYou need at least a question and 2 options.');
    }

    if (parts.length > 10) {
      return message.reply('You can only have up to 9 options.');
    }

    const question = parts[0];
    const options = parts.slice(1);
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Poll')
      .setDescription(`**${question}**`)
      .addFields(
        options.map((opt, i) => ({
          name: `${emojis[i]} ${opt}`,
          value: '\u200B',
          inline: false,
        }))
      )
      .setFooter({ text: `Poll by ${message.author.tag}` })
      .setTimestamp();

    const pollMessage = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojis[i]).catch(() => {});
    }

    if (message.deletable) message.delete().catch(() => {});
  },
};
