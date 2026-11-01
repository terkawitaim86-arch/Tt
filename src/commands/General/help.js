const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { infoEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'help',
  description: 'Shows all commands or details for a specific command.',
  category: 'General',
  usage: 'help [command]',
  aliases: ['h', 'commands'],
  async execute(message, args, client) {
    const prefix = message.guild
      ? await getPrefix(message.guild.id)
      : config.defaultPrefix;

    if (args[0]) {
      return showCommandHelp(message, args[0], client, prefix);
    }

    return showFullHelp(message, client, prefix);
  },
};

function showFullHelp(message, client, prefix) {
  const fields = [];

  for (const category of config.categories) {
    const header = `${category.emoji} ${category.name}`;

    if (category.comingSoon) {
      fields.push({
        name: header,
        value: `*Coming Soon* — ${category.description || 'Planned feature'}`,
        inline: false,
      });
      continue;
    }

    const seen = new Set();
    const commands = [];
    for (const [key, cmd] of client.commands) {
      if (cmd.category === category.name && !seen.has(cmd.name)) {
        seen.add(cmd.name);
        commands.push(`\`${prefix}${cmd.name}\``);
      }
    }

    fields.push({
      name: header,
      value: commands.length > 0 ? commands.join(' • ') : 'No commands yet',
      inline: false,
    });
  }

  const embed = infoEmbed({
    title: `${config.botName} — Help Menu`,
    description: `Here are all the available features.\nUse \`${prefix}help <command>\` for details.`,
    thumbnail: client.user.displayAvatarURL({ size: 256 }),
    fields,
    footer: `${config.botName} • Prefix: ${prefix}`,
  });

  return message.reply(replyOptions(embed));
}

function showCommandHelp(message, commandName, client, prefix) {
  const command = client.commands.get(commandName.toLowerCase());

  if (!command) {
    return message.reply(
      replyOptions(
        errorEmbed({
          title: 'Unknown command',
          description: `No command found named \`${commandName}\`.\nTry \`${prefix}help\` to list every command.`,
        })
      )
    );
  }

  const fields = [
    { name: 'Category', value: command.category || 'Unknown', inline: true },
    { name: 'Usage', value: `\`${prefix}${command.usage || command.name}\``, inline: true },
  ];

  if (command.aliases && command.aliases.length > 0) {
    fields.push({
      name: 'Aliases',
      value: command.aliases.map((a) => `\`${a}\``).join(', '),
      inline: true,
    });
  }

  const embed = infoEmbed({
    title: `${prefix}${command.name}`,
    description: command.description || 'No description available.',
    thumbnail: client.user.displayAvatarURL({ size: 256 }),
    fields,
    footer: `${config.botName} • Prefix: ${prefix}`,
  });

  return message.reply(replyOptions(embed));
}
