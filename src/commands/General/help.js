const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const {
  commandEmbed,
  usageErrorEmbed,
  createBaseEmbed,
  inlineCode,
  truncate,
  COLORS,
  BRAND,
} = require('../../utils/embedUtils');

module.exports = {
  name: 'help',
  description: 'Shows all commands or details for a specific command.',
  category: 'General',
  usage: 'help [command]',
  aliases: ['h', 'commands'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;

    if (args[0]) {
      return showCommandHelp(message, args[0], client, prefix);
    }

    return showFullHelp(message, client, prefix);
  },
};

function uniqueCommands(client) {
  const seen = new Set();
  const commands = [];

  for (const command of client.commands.values()) {
    if (seen.has(command.name)) continue;
    seen.add(command.name);
    commands.push(command);
  }

  return commands;
}

function showFullHelp(message, client, prefix) {
  const commands = uniqueCommands(client);
  const fields = [];

  for (const category of config.categories) {
    const names = commands
      .filter((command) => command.category === category.name)
      .map((command) => inlineCode(`${prefix}${command.name}`));

    if (category.comingSoon) {
      fields.push({
        name: category.name,
        value: `*Coming soon* — ${category.description || 'Planned feature'}`,
        inline: false,
      });
      continue;
    }

    fields.push({
      name: category.name,
      value: names.length > 0 ? names.join(' • ') : 'No commands yet',
      inline: false,
    });
  }

  const embed = createBaseEmbed({
    title: `${config.botName} — Commands`,
    description: truncate(
      `All ${commands.length} commands are listed below. Use ${inlineCode(`${prefix}help <command>`)} for syntax, arguments and examples.`,
      500
    ),
    thumbnail: client.user?.displayAvatarURL({ size: 256 }),
    fields,
    footer: truncate(`${BRAND} • Prefix ${prefix}`, 2048),
    color: COLORS.primary,
  });

  return message.reply({ embeds: [embed] });
}

function showCommandHelp(message, commandName, client, prefix) {
  const query = commandName.toLowerCase();
  const command = client.commands.get(query) || client.commands.get(`help:${query}`);

  if (!command) {
    const embed = usageErrorEmbed(
      null,
      prefix,
      `No command called ${inlineCode(query)} exists.`,
      {
        title: 'Unknown command',
        example: `${prefix}help`,
      }
    );

    embed.setDescription(`No command called ${inlineCode(query)} exists. Try ${inlineCode(`${prefix}help`)} for the full list.`);
    return message.reply({ embeds: [embed] });
  }

  const embed = commandEmbed(command, prefix, {
    thumbnail: client.user?.displayAvatarURL({ size: 128 }),
  });

  return message.reply({ embeds: [embed] });
}
