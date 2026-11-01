const { PermissionFlagsBits } = require('discord.js');
const { addXp, getXpData } = require('../../utils/xpManager');
const { infoEmbed, successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber } = require('../../utils/format');

module.exports = {
  name: 'removexp',
  description: 'Remove XP from a member.',
  category: 'XP & Levels',
  usage: 'removexp <@member> <amount>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Server** permission to use this command.',
          })
        )
      );
    }

    const member = message.mentions.members.first();
    const amount = parseInt(args[1], 10);

    if (!member || !Number.isFinite(amount) || amount < 1 || amount > 1000000) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'removexp',
            syntax: 'removexp <@member> <amount>',
            example: 'removexp @Member 100',
            description: 'Amount must be a whole number between 1 and 1,000,000.',
          })
        )
      );
    }

    const existing = await getXpData(message.guild.id, member.id);
    const currentXp = existing ? Number(existing.xp) || 0 : 0;

    if (currentXp <= 0) {
      return message.reply(
        replyOptions(
          infoEmbed({
            title: 'Nothing to remove',
            description: `<@${member.id}> has no XP yet.`,
          })
        )
      );
    }

    const delta = Math.min(amount, currentXp);
    const result = await addXp(message.guild.id, member.id, -delta);

    if (!result) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'XP not updated',
            description: 'Failed to remove XP. Please try again.',
          })
        )
      );
    }

    return message.reply(
      replyOptions(
        successEmbed({
          title: 'XP Removed',
          fields: [
            { name: 'Member', value: `<@${member.id}>`, inline: true },
            { name: 'Removed', value: `-${formatNumber(delta)}`, inline: true },
            { name: 'New Total', value: `${formatNumber(result.xp)} XP`, inline: true },
            { name: 'Level', value: `${result.level}`, inline: true },
          ],
          footer: delta < amount ? 'Requested amount was capped at the member\u2019s current XP.' : 'ZMB • XP',
        })
      )
    );
  },
};
