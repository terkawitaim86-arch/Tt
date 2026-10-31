const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { setXp, getXpData } = require('../../utils/xpManager');

module.exports = {
  name: 'addxp',
  description: 'Add XP to a member.',
  category: 'XP & Levels',
  usage: 'addxp <@member> <amount>',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const member = message.mentions.members.first();
    const amount = parseInt(args[1], 10);

    if (!member || !amount || amount < 1) {
      return message.reply('Usage: `addxp <@member> <amount>`');
    }

    const existing = await getXpData(message.guild.id, member.id);
    const newTotal = (existing ? existing.xp : 0) + amount;
    const success = await setXp(message.guild.id, member.id, newTotal);

    if (!success) {
      return message.reply('Failed to add XP. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('XP Added')
      .addFields(
        { name: 'Member', value: `<@${member.id}>`, inline: true },
        { name: 'Added', value: `+${amount}`, inline: true },
        { name: 'Total', value: `${newTotal}`, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
