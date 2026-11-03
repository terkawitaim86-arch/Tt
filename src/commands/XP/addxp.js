
const { PermissionFlagsBits } = require('discord.js');

const { addXp } = require('../../utils/xpManager');
const { getPrefix } = require('../../utils/prefixManager');

const {
  errorEmbed,
  usageEmbed,
  successEmbed,
} = require('../../utils/embedUtils');

const MAX_XP_AMOUNT = 1000000;

module.exports = {
  name: 'addxp',
  description: 'Add XP to a member.',
  category: 'XP & Levels',
  usage: 'addxp <@member> <amount>',
  aliases: [],

  async execute(message, args) {
    if (!message.guild || !message.member) return;

    if (!message.member.permissions.has(
      PermissionFlagsBits.ManageGuild
    )) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'You need the **Manage Server** permission.',
          }),
        ],
      });
    }

    const member = message.mentions.members.first();
    const amountText = args[1];

    const amount = /^\d+$/.test(amountText || '')
      ? Number(amountText)
      : NaN;

    if (
      !member ||
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > MAX_XP_AMOUNT
    ) {
      const prefix = await getPrefix(message.guild.id);

      return message.reply({
        embeds: [
          usageEmbed({
            command: 'addxp',
            syntax: `${prefix}addxp <@member> <amount>`,
            description: `Mention a member and enter a whole number from 1 to ${MAX_XP_AMOUNT.toLocaleString()}.`,
          }),
        ],
      });
    }

    try {
      const result = await addXp(
        message.guild.id,
        member.id,
        amount
      );

      if (
        !result ||
        !Number.isFinite(result.level) ||
        !Number.isFinite(result.xp)
      ) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: 'Failed to add XP. Please try again later.',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'XP Added Successfully',
            description: `Added **${amount.toLocaleString()} XP** to ${member}.`,
            fields: [
              {
                name: 'New Level',
                value: `**${result.level}**`,
                inline: true,
              },
              {
                name: 'Total XP',
                value: `**${result.xp.toLocaleString()}**`,
                inline: true,
              },
            ],
          }),
        ],
      });
    } catch (error) {
      console.error('[AddXP] Error:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            description: 'An unexpected error occurred while adding XP.',
          }),
        ],
      });
    }
  },
};
