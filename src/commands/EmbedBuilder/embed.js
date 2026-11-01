const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { saveTemplate, getTemplate, listTemplates, deleteTemplate } = require('../../utils/embedStore');
const { getPrefix } = require('../../utils/prefixManager');
const {
  commandEmbed,
  infoEmbed,
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  createBaseEmbed,
  normalizeColor,
  truncate,
  LIMITS,
  COLORS,
} = require('../../utils/embedUtils');

/** Build a member-supplied embed, clamped to Discord's documented limits. */
function buildEmbedFromData(data) {
  const embed = createBaseEmbed({
    title: data.title || undefined,
    description: data.description || undefined,
    color: data.color ? normalizeColor(String(data.color)) : COLORS.primary,
    thumbnail: data.thumbnail || undefined,
    image: data.image || undefined,
    fields: Array.isArray(data.fields)
      ? data.fields.map((field) => ({
          name: field?.name ?? '',
          value: field?.value ?? '',
          inline: Boolean(field?.inline),
        }))
      : [],
    footer: data.footer || undefined,
    author: data.author || undefined,
    timestamp: Boolean(data.timestamp),
  });

  if (!embed.data.footer && !data.timestamp) embed.setTimestamp();

  return embed;
}

const command = {
  name: 'embed',
  description: 'Create, save, and send custom embeds with the bot’s shared styling.',
  category: 'Embed Builder',
  usage: 'embed <send|save|load|list|delete> [args...]',
  aliases: ['embedbuilder'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });
    const broke = (title, description) =>
      message.reply({
        embeds: [createBaseEmbed({ title, description, color: COLORS.error, footerContext: 'Embeds' })],
      });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return fail('You need the **Manage Messages** permission to use this command.', 'Missing permission');
    }

    const subcommand = args[0]?.toLowerCase();

    try {
      if (subcommand === 'send') {
        const jsonText = args.slice(1).join(' ');
        if (!jsonText) {
          return fail('Provide embed data as JSON.', 'No embed data');
        }

        let data;
        try {
          data = JSON.parse(jsonText);
        } catch {
          return fail('That is not valid JSON. Check quotes and commas.', 'Invalid JSON');
        }

        const embed = buildEmbedFromData(data);
        if (message.deletable) message.delete().catch(() => {});
        return message.channel.send({ embeds: [embed] });
      }

      if (subcommand === 'save') {
        const name = args[1]?.toLowerCase();
        const jsonText = args.slice(2).join(' ');

        if (!name || !jsonText) {
          return fail('Provide a template name and embed data as JSON.', 'Missing template data');
        }

        let data;
        try {
          data = JSON.parse(jsonText);
        } catch {
          return fail('That is not valid JSON. Check quotes and commas.', 'Invalid JSON');
        }

        const success = await saveTemplate(message.guild.id, name, data);
        if (!success) return broke('Template not saved', 'The template could not be saved. Please try again.');

        return message.reply({
          embeds: [
            successEmbed({
              title: 'Template saved',
              description: `Embed template ${truncate(name, 60)} is ready to use with \`${prefix}embed load ${truncate(name, 60)}\`.`,
              footerContext: 'Embeds',
            }),
          ],
        });
      }

      if (subcommand === 'load') {
        const name = args[1]?.toLowerCase();
        if (!name) return fail('Provide the name of a saved template.', 'No template name');

        const data = await getTemplate(message.guild.id, name);
        if (!data) return broke('Template not found', `No template named ${truncate(name, 60)} is saved.`);

        const embed = buildEmbedFromData(data);
        if (message.deletable) message.delete().catch(() => {});
        return message.channel.send({ embeds: [embed] });
      }

      if (subcommand === 'list') {
        const templates = await listTemplates(message.guild.id);
        if (!templates.length) {
          return message.reply({
            embeds: [
              infoEmbed({
                title: 'No templates yet',
                description: `Save one with \`${prefix}embed save <name> {json}\`.`,
                footerContext: 'Embeds',
              }),
            ],
          });
        }

        const shown = templates.slice(0, LIMITS.fields);
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'Saved embed templates',
              description: shown.map((template) => `\`${truncate(String(template), 90)}\``).join('\n'),
              footerContext: `${templates.length} template${templates.length === 1 ? '' : 's'}`,
              author: message.guild ? { name: message.guild.name, iconURL: message.guild.iconURL() || undefined } : undefined,
            }),
          ],
        });
      }

      if (subcommand === 'delete') {
        const name = args[1]?.toLowerCase();
        if (!name) return fail('Provide the name of a saved template.', 'No template name');

        const success = await deleteTemplate(message.guild.id, name);
        if (!success) return broke('Template not found', `No template named ${truncate(name, 60)} is saved.`);

        return message.reply({
          embeds: [
            successEmbed({
              title: 'Template deleted',
              description: `Template ${truncate(name, 60)} has been removed.`,
              footerContext: 'Embeds',
            }),
          ],
        });
      }

      return message.reply({ embeds: [commandEmbed(command, prefix)] });
    } catch (error) {
      logCommandError('embed', error);
      return broke('Embed action failed', 'That embed action could not be completed. Please try again.');
    }
  },
};

module.exports = command;
