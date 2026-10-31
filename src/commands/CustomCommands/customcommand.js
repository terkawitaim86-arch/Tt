const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createCustomCommand, deleteCustomCommand, getAllCustomCommands } = require('../../utils/customCommandManager');

module.exports = {
  name: 'customcommand',
  description: 'Create, list, and delete custom commands for your server.',
  category: 'Custom Commands',
  usage: 'customcommand <add|list|delete> [name] [response]',
  aliases: ['cc'],
  async execute(message, args, client) {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'add') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('You need the **Manage Server** permission to create custom commands.');
      }

      const name = args[1]?.toLowerCase();
      const response = args.slice(2).join(' ');

      if (!name || !response) {
        return message.reply('Usage: `customcommand add <name> <response>`');
      }

      if (client.commands.has(name)) {
        return message.reply(`\`${name}\` is already a built-in command. Choose a different name.`);
      }

      const success = await createCustomCommand(message.guild.id, name, response, message.author.id);
      if (!success) return message.reply('Failed to save the custom command. Please try again.');

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('Custom Command Created')
        .addFields(
          { name: 'Name', value: `\`${name}\``, inline: true },
          { name: 'Response', value: response.slice(0, 1024), inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subcommand === 'delete') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('You need the **Manage Server** permission to delete custom commands.');
      }

      const name = args[1]?.toLowerCase();
      if (!name) {
        return message.reply('Usage: `customcommand delete <name>`');
      }

      const success = await deleteCustomCommand(message.guild.id, name);
      if (!success) return message.reply(`No custom command named \`${name}\` found.`);

      return message.reply(`Custom command \`${name}\` deleted.`);
    }

    if (subcommand === 'list') {
      const commands = await getAllCustomCommands(message.guild.id);
      if (commands.length === 0) {
        return message.reply('No custom commands created yet.');
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`Custom Commands — ${message.guild.name}`)
        .setDescription(commands.map((c) => `\`${c.command_name}\``).join(' • '))
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply(
      'Usage:\n' +
      '`customcommand add <name> <response>` — create a custom command\n' +
      '`customcommand list` — list all custom commands\n' +
      '`customcommand delete <name>` — delete a custom command'
    );
  },
};
