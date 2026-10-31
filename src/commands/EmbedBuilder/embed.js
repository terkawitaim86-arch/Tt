const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { saveTemplate, getTemplate, listTemplates, deleteTemplate } = require('../../utils/embedStore');

function buildEmbedFromData(data) {
  const embed = new EmbedBuilder();
  if (data.title) embed.setTitle(data.title);
  if (data.description) embed.setDescription(data.description);
  if (data.color) embed.setColor(parseInt(data.color.replace('#', ''), 16));
  else embed.setColor(config.embedColor);
  if (data.thumbnail) embed.setThumbnail(data.thumbnail);
  if (data.image) embed.setImage(data.image);
  if (data.footer) embed.setFooter({ text: data.footer });
  if (data.author) embed.setAuthor({ name: data.author });
  if (data.fields && Array.isArray(data.fields)) {
    for (const f of data.fields) {
      embed.addFields({ name: f.name, value: f.value, inline: f.inline || false });
    }
  }
  if (data.timestamp) embed.setTimestamp();
  return embed;
}

module.exports = {
  name: 'embed',
  description: 'Create, save, and send custom embeds.',
  category: 'Embed Builder',
  usage: 'embed <send|save|load|list|delete> [args...]',
  aliases: ['embedbuilder'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('You need the **Manage Messages** permission to use this command.');
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'send') {
      const jsonText = args.slice(1).join(' ');
      if (!jsonText) {
        return message.reply('Usage: `embed send {"title":"...", "description":"...", "color":"#5865F2", "thumbnail":"url", "image":"url", "footer":"text", "fields":[{"name":"...","value":"..."}]}`');
      }

      try {
        const data = JSON.parse(jsonText);
        const embed = buildEmbedFromData(data);
        if (message.deletable) message.delete().catch(() => {});
        return message.channel.send({ embeds: [embed] });
      } catch (error) {
        return message.reply('Invalid JSON. Make sure your embed data is valid JSON.');
      }
    }

    if (subcommand === 'save') {
      const name = args[1]?.toLowerCase();
      const jsonText = args.slice(2).join(' ');

      if (!name || !jsonText) {
        return message.reply('Usage: `embed save <name> {"title":"...", ...}`');
      }

      try {
        const data = JSON.parse(jsonText);
        const success = await saveTemplate(message.guild.id, name, data);
        if (!success) return message.reply('Failed to save template.');
        return message.reply(`Embed template **${name}** saved.`);
      } catch (error) {
        return message.reply('Invalid JSON. Make sure your embed data is valid JSON.');
      }
    }

    if (subcommand === 'load') {
      const name = args[1]?.toLowerCase();
      if (!name) {
        return message.reply('Usage: `embed load <name>`');
      }

      const data = await getTemplate(message.guild.id, name);
      if (!data) {
        return message.reply(`No template named **${name}** found.`);
      }

      const embed = buildEmbedFromData(data);
      if (message.deletable) message.delete().catch(() => {});
      return message.channel.send({ embeds: [embed] });
    }

    if (subcommand === 'list') {
      const templates = await listTemplates(message.guild.id);
      if (templates.length === 0) {
        return message.reply('No embed templates saved yet.');
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('Saved Embed Templates')
        .setDescription(templates.map((t) => `\`${t}\``).join('\n'))
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subcommand === 'delete') {
      const name = args[1]?.toLowerCase();
      if (!name) {
        return message.reply('Usage: `embed delete <name>`');
      }

      const success = await deleteTemplate(message.guild.id, name);
      if (!success) return message.reply(`No template named **${name}** found.`);
      return message.reply(`Embed template **${name}** deleted.`);
    }

    return message.reply(
      'Usage:\n' +
      '`embed send {"title":"...","description":"..."}` — send an embed\n' +
      '`embed save <name> {json}` — save a template\n' +
      '`embed load <name>` — load and send a saved template\n' +
      '`embed list` — list saved templates\n' +
      '`embed delete <name>` — delete a template'
    );
  },
};
