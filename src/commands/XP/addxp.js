const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { setXp, getXpData } = require('../../utils/xpManager');
const { getPrefix } = require('../../utils/prefixManager');
const { successEmbed, usageErrorEmbed, logCommandError, createBaseEmbed, COLORS } = require('../../utils/embedUtils');

const command = {
  name: 'addxp',
  description: 'Add XP to a member.',
  category: 'XP & Levels',
  usage: 'addxp <@member> <amount>',
  aliases: [],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const member = message.mentions.members.first();
    const amount = Number.parseInt(args[1], 10);

    if (!member) {
      return fail('Mention the member who should receive XP.', 'No member mentioned');
    }

    if (!Number.isFinite(amount) || amount < 1) {
      return fail('Provide a whole number of XP to add.', 'Invalid amount');
    }

    try {
      const existing = await getXpData(message.guild.id, member.id);
      const newTotal = (existing ? existing.xp : 0) + amount;
      const success = await setXp(message.guild.id, member.id, newTotal);

      if (!success) {
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'XP not added',
              description: 'The XP change could not be saved. Please try again.',
              color: COLORS.error,
              footerContext: 'Levels',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'XP added',
            description: `Gave **${amount}** XP to ${member}.`,
            fields: [
              { name: 'Member', value: `${member}`, inline: true },
              { name: 'Added', value: `+${amount}`, inline: true },
              { name: 'New total', value: `${newTotal}`, inline: true },
            ],
            footerContext: 'Levels',
          }),
        ],
      });
    } catch (error) {
      logCommandError('addxp', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'XP not added',
            description: 'The XP change could not be saved. Please try again.',
            color: COLORS.error,
            footerContext: 'Levels',
          }),
        ],
      });
    }
  },
};

module.exports = command;
