
const { EmbedBuilder } = require('discord.js');

/**
 * ZMB OFFICIAL brand colours.
 */
const BRAND = Object.freeze({
  primary: 0x5865f2,
  success: 0x57f287,
  error: 0xed4245,
  warning: 0xfee75c,
  info: 0x5865f2,
  neutral: 0x2b2d31,
});

function normalizeColor(color) {
  if (
    typeof color === 'number' &&
    Number.isInteger(color) &&
    color >= 0 &&
    color <= 0xffffff
  ) {
    return color;
  }

  if (typeof color === 'string') {
    const value = color.replace(/^#/, '').trim();

    if (/^[0-9a-f]{6}$/i.test(value)) {
      return Number.parseInt(value, 16);
    }
  }

  return BRAND.primary;
}

function isValidUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeAuthor(author) {
  if (!author) return null;

  if (typeof author === 'string') {
    return { name: author.slice(0, 256) };
  }

  if (typeof author !== 'object' || Array.isArray(author)) {
    return null;
  }

  const result = {
    name: String(author.name || 'ZMB OFFICIAL').slice(0, 256),
  };

  const iconURL = author.iconURL || author.icon_url;

  if (isValidUrl(iconURL)) {
    result.iconURL = iconURL;
  }

  if (isValidUrl(author.url)) {
    result.url = author.url;
  }

  return result;
}

function normalizeFooter(footer) {
  if (!footer) return null;

  if (typeof footer === 'string') {
    return { text: footer.slice(0, 2048) };
  }

  if (typeof footer !== 'object' || Array.isArray(footer)) {
    return null;
  }

  const result = {
    text: String(footer.text || 'ZMB OFFICIAL').slice(0, 2048),
  };

  const iconURL = footer.iconURL || footer.icon_url;

  if (isValidUrl(iconURL)) {
    result.iconURL = iconURL;
  }

  return result;
}

/**
 * Creates a consistent ZMB embed.
 */
function createBaseEmbed({
  title,
  description,
  url,
  color = BRAND.primary,
  author,
  footer,
  thumbnail,
  image,
  fields = [],
  timestamp = true,
} = {}) {
  const embed = new EmbedBuilder()
    .setColor(normalizeColor(color));

  if (title) {
    embed.setTitle(String(title).slice(0, 256));
  }

  if (description) {
    embed.setDescription(String(description).slice(0, 4096));
  }

  if (isValidUrl(url)) {
    embed.setURL(url);
  }

  const normalizedAuthor = normalizeAuthor(author);

  if (normalizedAuthor) {
    embed.setAuthor(normalizedAuthor);
  }

  const normalizedFooter = normalizeFooter(footer);

  if (normalizedFooter) {
    embed.setFooter(normalizedFooter);
  }

  if (isValidUrl(thumbnail)) {
    embed.setThumbnail(thumbnail);
  }

  if (isValidUrl(image)) {
    embed.setImage(image);
  }

  if (Array.isArray(fields) && fields.length) {
    const validFields = fields
      .filter((field) => field && typeof field === 'object')
      .slice(0, 25)
      .map((field) => ({
        name: String(field.name || '\u200b').slice(0, 256),
        value: String(field.value || '\u200b').slice(0, 1024),
        inline: Boolean(field.inline),
      }));

    if (validFields.length) {
      embed.addFields(validFields);
    }
  }

  if (timestamp) {
    embed.setTimestamp();
  }

  return embed;
}

/**
 * Success response.
 */
function successEmbed({
  title = 'Success',
  description,
  fields = [],
  footer = 'ZMB OFFICIAL',
  color = BRAND.success,
  thumbnail,
  author,
} = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    footer,
    color,
    thumbnail,
    author,
  });
}

/**
 * Error response.
 */
function errorEmbed({
  title = 'Action failed',
  description,
  fields = [],
  footer = 'ZMB OFFICIAL',
  color = BRAND.error,
  thumbnail,
} = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    footer,
    color,
    thumbnail,
  });
}

/**
 * Warning response.
 */
function warningEmbed({
  title = 'Warning',
  description,
  fields = [],
  footer = 'ZMB OFFICIAL',
  color = BRAND.warning,
} = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    footer,
    color,
  });
}

/**
 * Informational response.
 */
function infoEmbed({
  title,
  description,
  fields = [],
  footer = 'ZMB OFFICIAL',
  color = BRAND.info,
  thumbnail,
  author,
  image,
} = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    footer,
    color,
    thumbnail,
    author,
    image,
  });
}

/**
 * Command usage response.
 */
function usageEmbed({
  command,
  syntax,
  example,
  description,
  footer = 'ZMB OFFICIAL • Usage',
} = {}) {
  const fields = [];

  if (syntax) {
    fields.push({
      name: 'Syntax',
      value: `\`${syntax}\``,
      inline: false,
    });
  }

  if (example) {
    fields.push({
      name: 'Example',
      value: `\`${example}\``,
      inline: false,
    });
  }

  return createBaseEmbed({
    title: command ? `Usage · ${command}` : 'Usage',
    description: description || 'Check the format and try again.',
    color: BRAND.primary,
    fields,
    footer,
  });
}

/**
 * Moderation response.
 */
function modEmbed({
  title,
  description,
  fields = [],
  color = BRAND.primary,
  footer = 'ZMB OFFICIAL • Moderation',
  thumbnail,
} = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    color,
    footer,
    thumbnail,
  });
}

module.exports = {
  BRAND,
  normalizeColor,
  createBaseEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  usageEmbed,
  modEmbed,
};
