const { infoEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber } = require('../../utils/format');

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
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'calculate',
            syntax: 'calculate <expression>',
            example: 'calculate 2 + 3 * 4',
          })
        )
      );
    }

    if (!MATH_REGEX.test(expr)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Invalid expression',
            description: 'Only numbers and `+ - * / ( ) %` are allowed.',
          })
        )
      );
    }

    try {
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        return message.reply(
          replyOptions(
            errorEmbed({
              title: 'No result',
              description: "That expression doesn't produce a valid number.",
            })
          )
        );
      }

      const embed = infoEmbed({
        title: 'Calculator',
        fields: [
          { name: 'Expression', value: `\`${expr.slice(0, 1000)}\``, inline: false },
          {
            name: 'Result',
            value: `**${Number.isInteger(result) ? formatNumber(result) : result}**`,
            inline: false,
          },
        ],
        footer: 'ZMB • Calculator',
      });

      return message.reply(replyOptions(embed));
    } catch (error) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Invalid expression',
            description: "That expression couldn't be evaluated. Please check your syntax.",
          })
        )
      );
    }
  },
};
