
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');

const {
  saveTemplate,
  getTemplate,
  listTemplates,
  deleteTemplate,
} = require('../../utils/embedStore');

const { getPrefix } = require('../../utils/prefixManager');

const {
  errorEmbed,
  usageEmbed,
  successEmbed,
  infoEmbed,
  createBaseEmbed,
} = require('../../utils/embedUtils');

const MAX_JSON_LENGTH = 12000;
const MAX_TEMPLATE_NAME = 32;

function validateEmbedData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Embed data must be a JSON object.');
  }

  const allowedKeys = [
    'title',
    'description',
    'url',
    'color',
    'author',
    'footer',
    'thumbnail',
    'image',
    'fields',
    'timestamp',
  ];

  for (const key of Object.keys(data)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unsupported embed property: ${key}`);
    }
  }

  if (data.title && typeof data.title !== 'string') {
    throw new Error('Title must be text.');
  }

  if (data.description && typeof data.description !== 'string') {
    throw new Error('Description must be text.');
  }

  if (data.title?.length > 256) {
    throw new Error('Title cannot exceed 256 characters.');
  }

  if (data.description?.length > 4096) {
    throw new Error('Description cannot exceed 4096 characters.');
  }

  if (data.url && !isValidUrl(data.url)) {
    throw new Error('Embed URL must be a valid HTTP or HTTPS URL.');
  }

  if (
    data.color !== undefined &&
    !(
      (typeof data.color === 'number' &&
        Number.isInteger(data.color) &&
        data.color >= 0 &&
        data.color <= 0xFFFFFF) ||
      (typeof data.color === 'string' &&
        /^#?[0-9a-f]{6}$/i.test(data.color))
    )
  ) {
    throw new Error('Color must be a valid hex color or integer.');
  }

  for (const key of ['thumbnail', 'image']) {
    if (data[key] && !isValidUrl(data[key])) {
      throw new Error(`${key} must be a valid HTTP or HTTPS URL.`);
    }
  }

  if (data.author !== undefined) {
    if (
      typeof data.author !== 'object' ||
      data.author === null ||
      Array.isArray(data.author)
    ) {
      throw new Error('Author must be an object.');
    }

    if (typeof data.author.name !== 'string' || !data.author.name.trim()) {
      throw new Error('Author name is required.');
    }

    if (data.author.name.length > 256) {
      throw new Error('Author name cannot exceed 256 characters.');
    }

    if (data.author.url && !isValidUrl(data.author.url)) {
      throw new Error('Author URL is invalid.');
    }

    if (data.author.iconURL && !isValidUrl(data.author.iconURL)) {
      throw new Error('Author icon URL is invalid.');
    }
  }

  if (data.footer !== undefined) {
    if (
      typeof data.footer !== 'object' ||
      data.footer === null ||
      Array.isArray(data.footer)
    ) {
      throw new Error('Footer must be an object.');
    }

    if (typeof data.footer.text !== 'string' || !data.footer.text.trim()) {
      throw new Error('Footer text is required.');
    }

    if (data.footer.text.length > 2048) {
      throw new Error('Footer text cannot exceed 2048 characters.');
    }

    if (data.footer.iconURL && !isValidUrl(data.footer.iconURL)) {
      throw new Error('Footer icon URL is invalid.');
    }
  }

  if (data.fields !== undefined) {
    if (!Array.isArray(data.fields) || data.fields.length > 25) {
      throw new Error('An embed can have a maximum of 25 fields.');
    }

    for (const field of data.fields) {
      if (
        !field ||
        typeof field.name !== 'string' ||
        typeof field.value !== 'string' ||
        !field.name.trim() ||
        !field.value.trim()
      ) {
        throw new Error('Every field needs a name and value.');
      }

      if (field.name.length > 256 || field.value.length > 1024) {
        throw new Error('Field names and values exceed Discord limits.');
      }

      if (
        field.inline !== undefined &&
        typeof field.inline !== 'boolean'
      ) {
        throw new Error('Field inline must be true or false.');
      }
    }
  }

  const totalLength =
    (data.title?.length || 0) +
    (data.description?.length || 0) +
    (data.author?.name?.length || 0) +
    (data.footer?.text?.length || 0) +
    (data.fields || []).reduce(
      (total, field) => total + field.name.length + field.value.length,
      0
    );

  if (totalLength > 6000) {
    throw new Error('The total embed text cannot exceed 6000 characters.');
  }

  return data;
}

function isValidUrl(value) {
  if (typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function buildEmbedFromData(data) {
  validateEmbedData(data);

  const embed = createBaseEmbed({
    title: data.title,
    description: data.description,
    url: data.url,
    color: data.color || config.embedColor,
    author: data.author,
    footer: data.footer,
    thumbnail: data.thumbnail,
    image: data.image,
    fields: data.fields || [],
    timestamp: data.timestamp !== false,
  });

  return embed;
}

function validTemplateName(name) {
  return (
    typeof name === 'string' &&
    /^[a-z0-9_-]{1,32}$/i.test(name)
  );
}

function parseJson(text) {
  if (!text || text.length > MAX_JSON_LENGTH) {
    throw new Error('JSON is empty or too large.');
  }

  return buildEmbedFromData(JSON.parse(text));
}

module.exports = {
  name: 'embed',
  description: 'Send, save, load, list, or delete embed templates.',
  category: 'Embed Builder',
  usage: 'embed <send|save|load|list|delete> ...',
  aliases: [],

  async execute(message, args) {
    if (!message.guild || !message.member) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'You need the **Manage Messages** permission.',
          }),
        ],
      });
    }

    const prefix = await getPrefix(message.guild.id).catch(() => ',');

    const subcommand = args[0]?.toLowerCase();

    try {
      if (subcommand === 'send') {
        const jsonText = args.slice(1).join(' ');

        if (!jsonText) {
          return message.reply({
            embeds: [
              usageEmbed({
                command: 'embed send',
                syntax: `${prefix}embed send {"title":"...","description":"..."}`,
              }),
            ],
          });
        }

        const embed = parseJson(jsonText);

        if (!message.guild.members.me?.permissionsIn(message.channel)
          .has(PermissionFlagsBits.EmbedLinks)) {
          return message.reply({
            embeds: [
              errorEmbed({
                description: 'I need the **Embed Links** permission in this channel.',
              }),
            ],
          });
        }

        await message.channel.send({
          embeds: [embed],
          allowedMentions: { parse: [] },
        });

        if (message.deletable) {
          await message.delete().catch(() => {});
        }

        return;
      }

      if (subcommand === 'save') {
        const name = args[1]?.toLowerCase();
        const jsonText = args.slice(2).join(' ');

        if (!name || !jsonText) {
          return message.reply({
            embeds: [
              usageEmbed({
                command: 'embed save',
                syntax: `${prefix}embed save <name> {json}`,
              }),
            ],
          });
        }

        if (!validTemplateName(name)) {
          return message.reply({
            embeds: [
              errorEmbed({
                description: 'Template names can only contain letters, numbers, underscores and hyphens (max 32 characters).',
              }),
            ],
          });
        }

        const embed = parseJson(jsonText);
        const success = await saveTemplate(
          message.guild.id,
          name,
          embed.toJSON()
        );

        if (!success) {
          return message.reply({
            embeds: [
              errorEmbed({
                description: 'Failed to save the template. Check the database connection.',
              }),
            ],
          });
        }

        return message.reply({
          embeds: [
            successEmbed({
              description: `Embed template **${name}** saved successfully.`,
            }),
          ],
        });
      }

      if (subcommand === 'load') {
        const name = args[1]?.toLowerCase();

        if (!name || !validTemplateName(name)) {
          return message.reply({
            embeds: [
              usageEmbed({
                command: 'embed load',
                syntax: `${prefix}embed load <name>`,
              }),
            ],
          });
        }

        const data = await getTemplate(message.guild.id, name);

        if (!data) {
          return message.reply({
            embeds: [
              errorEmbed({
                description: `No template named **${name}** was found.`,
              }),
            ],
          });
        }

        const embed = buildEmbedFromData(data);

        if (!message.guild.members.me?.permissionsIn(message.channel)
          .has(PermissionFlagsBits.EmbedLinks)) {
          return message.reply({
            embeds: [
              errorEmbed({
                description: 'I need the **Embed Links** permission in this channel.',
              }),
            ],
          });
        }

        await message.channel.send({
          embeds: [embed],
          allowedMentions: { parse: [] },
        });

        if (message.deletable) {
          await message.delete().catch(() => {});
        }

        return;
      }

      if (subcommand === 'list') {
        const templates = await listTemplates(message.guild.id);

        if (!Array.isArray(templates) || !templates.length) {
          return message.reply({
            embeds: [
              infoEmbed({
                title: 'Saved Embed Templates',
                description: 'No templates saved yet.',
              }),
            ],
          });
        }

        const names = templates
          .map((template) => typeof template === 'string'
            ? template
            : template.name || template.template_name)
          .filter(Boolean);

        const description = names
          .slice(0, 60)
          .map((name) => `\`${name}\``)
          .join('\n');

        return message.reply({
          embeds: [
            infoEmbed({
              title: 'Saved Embed Templates',
              description: description || 'No templates found.',
              footer: { text: `${names.length} saved template(s)` },
            }),
          ],
        });
      }

      if (subcommand === 'delete') {
        const name = args[1]?.toLowerCase();

        if (!name || !validTemplateName(name)) {
          return message.reply({
            embeds: [
              usageEmbed({
                command: 'embed delete',
                syntax: `${prefix}embed delete <name>`,
              }),
            ],
          });
        }

        const success = await deleteTemplate(message.guild.id, name);

        if (!success) {
          return message.reply({
            embeds: [
              errorEmbed({
                description: `No template named **${name}** was found.`,
              }),
            ],
          });
        }

        return message.reply({
          embeds: [
            successEmbed({
              description: `Embed template **${name}** deleted.`,
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          usageEmbed({
            command: 'embed',
            syntax: `${prefix}embed <send|save|load|list|delete> ...`,
            description: 'Build and manage embed templates with JSON.',
          }),
        ],
      });
    } catch (error) {
      console.error('[Embed Command] Error:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            description: error.message || 'Something went wrong while processing the embed.',
          }),
        ],
      }).catch(() => {});
    }
  },
};
