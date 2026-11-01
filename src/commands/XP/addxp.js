const { PermissionFlagsBits } = require('discord.js');
const { addXp } = require('../../utils/xpManager');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber } = require('../../utils/format');

module.exports = {
  name: 'addxp',
  description: 'Add XP to a member.',
  category: 'XP & Levels',
  usage: 'addxp <@member> <amount>',
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
            command: 'addxp',
            syntax: 'addxp <@member> <amount>',
            example: 'addxp @Member 250',
            description: 'Amount must be a whole number between 1 and 1,000,000.',
          })
        )
      );
    }

    // Atomic increment on the database side (see supabase/migrations/*_atomic_xp_update.sql).
    const result = await addXp(message.guild.id, member.id, amount);

    if (!result) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'XP not updated',
            description: 'Failed to add XP. Please try again.',
          })
        )
      );
    }

    return message.reply(
      replyOptions(
        successEmbed({
          title: 'XP Added',
          fields: [
            { name: 'Member', value: `<@${member.id}>`, inline: true },
            { name: 'Added', value: `+${formatNumber(amount)}`, inline: true },
            { name: 'New Total', value: `${formatNumber(result.xp)} XP`, inline: true },
            { name: 'Level', value: `${result.level}`, inline: true },
          ],
          footer: 'ZMB • XP',
        })
      )
    );
  },
};
