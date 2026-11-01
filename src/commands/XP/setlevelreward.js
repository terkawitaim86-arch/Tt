const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const supabase = require('../../utils/db');
const { getPrefix } = require('../../utils/prefixManager');
const { successEmbed, usageErrorEmbed, logCommandError, createBaseEmbed, COLORS } = require('../../utils/embedUtils');

const command = {
  name: 'setlevelreward',
  description: 'Set a role to be auto-assigned when a member reaches a level.',
  category: 'XP & Levels',
  usage: 'setlevelreward <level> <@role>',
  aliases: ['levelreward'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const level = Number.parseInt(args[0], 10);
    const role = message.mentions.roles.first();

    if (!Number.isFinite(level) || level < 1) {
      return fail('Provide the level that should trigger the reward.', 'Invalid level');
    }

    if (!role) {
      return fail('Mention the role to grant at that level.', 'No role mentioned');
    }

    try {
      const { error } = await supabase
        .from('level_rewards')
        .upsert(
          {
            guild_id: message.guild.id,
            level,
            role_id: role.id,
          },
          { onConflict: 'guild_id,level' }
        );

      if (error) {
        logCommandError('setlevelreward', error.message);
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'Level reward not saved',
              description: 'The level reward could not be saved. Please try again.',
              color: COLORS.error,
              footerContext: 'Levels',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Level reward set',
            description: `Members who reach level **${level}** will receive <@&${role.id}>.`,
            footerContext: 'Levels',
          }),
        ],
      });
    } catch (error) {
      logCommandError('setlevelreward', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Level reward not saved',
            description: 'The level reward could not be saved. Please try again.',
            color: COLORS.error,
            footerContext: 'Levels',
          }),
        ],
      });
    }
  },
};

module.exports = command;
