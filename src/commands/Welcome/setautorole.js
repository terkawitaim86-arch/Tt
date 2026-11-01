const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { updateSettings } = require('../../utils/guildSettings');
const { getPrefix } = require('../../utils/prefixManager');
const { successEmbed, usageErrorEmbed, logCommandError, createBaseEmbed, COLORS } = require('../../utils/embedUtils');

const command = {
  name: 'setautorole',
  description: 'Set a role automatically given to new members.',
  category: 'Welcome',
  usage: 'setautorole <@role>',
  aliases: ['autorole'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const role = message.mentions.roles.first();
    if (!role) {
      return fail('Mention the role new members should receive.', 'No role mentioned');
    }

    try {
      const success = await updateSettings(message.guild.id, { auto_role_id: role.id });

      if (!success) {
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'Auto role not saved',
              description: 'The auto role could not be saved. Please try again.',
              color: COLORS.error,
              footerContext: 'Welcome',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Auto role set',
            description: `Every new member will receive <@&${role.id}>.`,
            footerContext: 'Welcome',
          }),
        ],
      });
    } catch (error) {
      logCommandError('setautorole', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Auto role not saved',
            description: 'The auto role could not be saved. Please try again.',
            color: COLORS.error,
            footerContext: 'Welcome',
          }),
        ],
      });
    }
  },
};

module.exports = command;
