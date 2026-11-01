const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');

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
  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(`${config.botName} — Help Menu`)
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setDescription('Here are all the available and planned features.')
    .setTimestamp();

  for (const category of config.categories) {
    const header = `${category.emoji} ${category.name}`;

    if (category.comingSoon) {
      embed.addFields({
        name: header,
        value: `*Coming Soon* — ${category.description || 'Planned feature'}`,
        inline: false,
      });
    } else {
      const seen = new Set();
      const commands = [];
      for (const [key, cmd] of client.commands) {
        if (cmd.category === category.name && !seen.has(cmd.name)) {
          seen.add(cmd.name);
          commands.push(`\`${prefix}${cmd.name}\``);
        }
      }

      embed.addFields({
        name: header,
        value: commands.length > 0 ? commands.join(' • ') : 'No commands yet',
        inline: false,
      });
    }
  }

  embed.setFooter({
    text: `Use ${prefix}help <command> for details • Prefix: ${prefix}`,
  });

  return message.reply({ embeds: [embed] });
}

function showCommandHelp(message, commandName, client, prefix) {
  const command = client.commands.get(commandName.toLowerCase());

  if (!command) {
    return message.reply(`No command found named \`${commandName}\`.`);
  }

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(`${prefix}${command.name}`)
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setDescription(command.description || 'No description available.')
    .addFields(
      { name: 'Category', value: command.category || 'Unknown', inline: true },
      { name: 'Usage', value: `\`${prefix}${command.usage || command.name}\``, inline: true }
    )
    .setFooter({ text: `${config.botName} • Prefix: ${prefix}` })
    .setTimestamp();

  if (command.aliases && command.aliases.length > 0) {
    embed.addFields({
      name: 'Aliases',
      value: command.aliases.map((a) => `\`${a}\``).join(', '),
      inline: true,
    });
  }

  return message.reply({ embeds: [embed] });
}
