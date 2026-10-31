const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { setXp, getXpData } = require('../../utils/xpManager');

module.exports = {
  name: 'removexp',
  description: 'Remove XP from a member.',
  category: 'XP & Levels',
  usage: 'removexp <@member> <amount>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const member = message.mentions.members.first();
    const amount = parseInt(args[1], 10);

    if (!member || !amount || amount < 1) {
      return message.reply('Usage: `removexp <@member> <amount>`');
    }

    const existing = await getXpData(message.guild.id, member.id);
    const newTotal = Math.max(0, (existing ? existing.xp : 0) - amount);
    const success = await setXp(message.guild.id, member.id, newTotal);

    if (!success) {
      return message.reply('Failed to remove XP. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('XP Removed')
      .addFields(
        { name: 'Member', value: `<@${member.id}>`, inline: true },
        { name: 'Removed', value: `-${amount}`, inline: true },
        { name: 'Total', value: `${newTotal}`, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
