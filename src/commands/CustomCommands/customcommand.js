const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createCustomCommand, deleteCustomCommand, getAllCustomCommands } = require('../../utils/customCommandManager');
const { getPrefix } = require('../../utils/prefixManager');
const {
  commandEmbed,
  infoEmbed,
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  createBaseEmbed,
  sanitizeReason,
  truncate,
  LIMITS,
  COLORS,
} = require('../../utils/embedUtils');

const command = {
  name: 'customcommand',
  description: 'Create, list, and delete custom commands for your server.',
  category: 'Custom Commands',
  usage: 'customcommand <add|list|delete> [name] [response]',
  aliases: ['cc'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });
    const broke = (title, description) =>
      message.reply({
        embeds: [createBaseEmbed({ title, description, color: COLORS.error, footerContext: 'Custom commands' })],
      });
    const manageGuild = () =>
      fail('You need the **Manage Server** permission to change custom commands.', 'Missing permission');

    const subcommand = args[0]?.toLowerCase();

    try {
      if (subcommand === 'add') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return manageGuild();

        const name = args[1]?.toLowerCase();
        const response = args.slice(2).join(' ');

        if (!name || !response) {
          return fail('Provide a name and the response text.', 'Missing name or response');
        }

        if (client.commands.has(name)) {
          return fail(`\`${truncate(name, 60)}\` is already a built-in command. Choose another name.`, 'Name already used');
        }

        const success = await createCustomCommand(message.guild.id, name, response, message.author.id);
        if (!success) return broke('Command not saved', 'The custom command could not be saved. Please try again.');

        return message.reply({
          embeds: [
            successEmbed({
              title: 'Custom command created',
              description: `Members can now run it with \`${prefix}${truncate(name, 60)}\`.`,
              fields: [
                { name: 'Name', value: `\`${truncate(name, 60)}\``, inline: true },
                { name: 'Response', value: sanitizeReason(response, 'No response'), inline: false },
              ],
              footerContext: 'Custom commands',
            }),
          ],
        });
      }

      if (subcommand === 'delete') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return manageGuild();

        const name = args[1]?.toLowerCase();
        if (!name) return fail('Provide the name of the custom command to delete.', 'No name provided');

        const success = await deleteCustomCommand(message.guild.id, name);
        if (!success) return broke('Command not found', `No custom command named \`${truncate(name, 60)}\` exists.`);

        return message.reply({
          embeds: [
            successEmbed({
              title: 'Custom command deleted',
              description: `\`${prefix}${truncate(name, 60)}\` has been removed.`,
              footerContext: 'Custom commands',
            }),
          ],
        });
      }

      if (subcommand === 'list' || !subcommand) {
        const commands = await getAllCustomCommands(message.guild.id);

        if (!commands.length) {
          return message.reply({
            embeds: [
              infoEmbed({
                title: 'No custom commands yet',
                description: `Create one with \`${prefix}customcommand add <name> <response>\`.`,
                footerContext: 'Custom commands',
              }),
            ],
          });
        }

        const shown = commands.slice(0, LIMITS.fields);
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'Custom commands',
              description: shown.map((entry) => `\`${truncate(entry.command_name, 90)}\``).join(' • '),
              footerContext: `${commands.length} command${commands.length === 1 ? '' : 's'}`,
              author: message.guild ? { name: message.guild.name, iconURL: message.guild.iconURL() || undefined } : undefined,
            }),
          ],
        });
      }

      return message.reply({ embeds: [commandEmbed(command, prefix)] });
    } catch (error) {
      logCommandError('customcommand', error);
      return broke('Custom command action failed', 'That action could not be completed. Please try again.');
    }
  },
};

module.exports = command;
