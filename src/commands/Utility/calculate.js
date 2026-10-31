const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

const MATH_REGEX = /^[0-9+\-*/().%\s]+$/;

module.exports = {
  name: 'calculate',
  description: 'Evaluate a math expression.',
  category: 'Utility',
  usage: 'calculate <expression>',
  aliases: ['calc', 'math'],
  async execute(message, args, client) {
    const expr = args.join(' ');
    if (!expr) {
      return message.reply('Usage: `calculate <expression>`\nExample: `calculate 2 + 3 * 4`');
    }

    if (!MATH_REGEX.test(expr)) {
      return message.reply('Invalid expression. Only numbers and `+ - * / ( ) %` are allowed.');
    }

    try {
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result !== 'number' || !isFinite(result)) {
        return message.reply('That expression doesn\'t produce a valid number.');
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('Calculator')
        .addFields(
          { name: 'Expression', value: `\`${expr}\``, inline: false },
          { name: 'Result', value: `**${result}**`, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      return message.reply('Invalid math expression. Please check your syntax.');
    }
  },
};
