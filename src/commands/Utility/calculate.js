const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { infoEmbed, usageErrorEmbed, inlineCode, logCommandError } = require('../../utils/embedUtils');

const MATH_REGEX = /^[0-9+\-*/().%\s]+$/;

const command = {
  name: 'calculate',
  description: 'Evaluate a math expression.',
  category: 'Utility',
  usage: 'calculate <expression>',
  aliases: ['calc', 'math'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    const expr = args.join(' ');
    if (!expr) {
      return fail('Provide a math expression to evaluate.', 'No expression');
    }

    if (!MATH_REGEX.test(expr)) {
      return fail('Only numbers and `+ - * / ( ) %` are allowed in an expression.', 'Invalid expression');
    }

    try {
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        return fail('That expression does not produce a valid number.', 'Invalid result');
      }

      return message.reply({
        embeds: [
          infoEmbed({
            title: 'Calculator',
            description: `${inlineCode(expr)} = **${result}**`,
            footerContext: 'Calculator',
          }),
        ],
      });
    } catch (error) {
      logCommandError('calculate', error);
      return fail('That expression could not be evaluated. Check the syntax.', 'Invalid expression');
    }
  },
};

module.exports = command;
