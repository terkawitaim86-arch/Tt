
const { PermissionFlagsBits } = require('discord.js');
const { addXp, getXpData } = require('../../utils/xpManager');
const { getPrefix } = require('../../utils/prefixManager');
const { errorEmbed, usageEmbed, successEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'addxp',
  description: 'Add XP to a member.',
  category: 'XP & Levels',
  usage: 'addxp <@member> <amount>',
  aliases: [],
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ embeds: [errorEmbed({ description: 'You need the **Manage Server** permission.' })] });
    }
    const member = message.mentions.members.first();
    const amount = parseInt(args[1], 10);
    if (!member || !amount || amount < 1) {
      const prefix = await getPrefix(message.guild.id);
      return message.reply({ embeds: [usageEmbed({ command: 'addxp', syntax: `${prefix}addxp <@member> <amount>` })] });
    }
    const result = await addXp(message.guild.id, member.id, amount);
    if (!result) return message.reply({ embeds: [errorEmbed({ description: 'Failed to add XP.' })] });
    return message.reply({
      embeds: [
        successEmbed({
          title: 'XP Added',
          description: `Added **${amount}** XP to <@${member.id}>.`,
          fields: [
            { name: 'Level', value: `${result.level}`, inline: true },
            { name: 'Total XP', value: `${result.xp}`, inline: true },
          ],
        }),
      ],
    });
  },
};
