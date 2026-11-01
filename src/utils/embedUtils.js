const { EmbedBuilder } = require('discord.js');

function normalizeColor(color) {
  if (typeof color === 'number' && Number.isFinite(color)) return color;
  if (typeof color === 'string') {
    const maybe = color.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(maybe)) {
      return Number.parseInt(maybe, 16);
    }
  }
  return 0x5865f2;
}

function createBaseEmbed({ title, description, color = 0x5865f2, author, footer, thumbnail, image, timestamp = true } = {}) {
  const embed = new EmbedBuilder().setColor(normalizeColor(color));

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (author) embed.setAuthor(typeof author === 'string' ? { name: author } : author);
  if (footer) embed.setFooter(typeof footer === 'string' ? { text: footer } : footer);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (timestamp) embed.setTimestamp();

  return embed;
}

function successEmbed({ title, description, fields = [], footer = 'ZMB • Success', color = 0x57f287 } = {}) {
  const embed = createBaseEmbed({ title, description, color, footer, timestamp: true });
  if (Array.isArray(fields) && fields.length) embed.addFields(fields);
  return embed;
}

function errorEmbed({ title = 'Action failed', description, fields = [], footer = 'ZMB • Error', color = 0xef4444 } = {}) {
  const embed = createBaseEmbed({ title, description, color, footer, timestamp: true });
  if (Array.isArray(fields) && fields.length) embed.addFields(fields);
  return embed;
}

function warningEmbed({ title = 'Warning', description, fields = [], footer = 'ZMB • Warning', color = 0xfbbf24 } = {}) {
  const embed = createBaseEmbed({ title, description, color, footer, timestamp: true });
  if (Array.isArray(fields) && fields.length) embed.addFields(fields);
  return embed;
}

function infoEmbed({ title, description, fields = [], footer = 'ZMB • Info', color = 0x5865f2 } = {}) {
  const embed = createBaseEmbed({ title, description, color, footer, timestamp: true });
  if (Array.isArray(fields) && fields.length) embed.addFields(fields);
  return embed;
}

function usageEmbed({ command, syntax, example, description, footer = 'ZMB • Usage' } = {}) {
  const embed = createBaseEmbed({
    title: `Usage: ${command}`,
    description: description || 'The command format was invalid.',
    color: 0x5865f2,
    footer,
    timestamp: true,
  });

  if (syntax) embed.addFields({ name: 'Syntax', value: `\`${syntax}\``, inline: false });
  if (example) embed.addFields({ name: 'Example', value: `\`${example}\``, inline: false });

  return embed;
}

/** Mentions are rendered but never ping anyone — safe for every command reply. */
const SAFE_MENTIONS = Object.freeze({ parse: [], repliedUser: false });

/**
 * Build a message payload from one or more embeds with safe mention handling.
 * @param {...any} embeds EmbedBuilder instances (or arrays of them)
 */
function replyOptions(...embeds) {
  const list = embeds.flat().filter(Boolean);
  return { embeds: list, allowedMentions: { ...SAFE_MENTIONS } };
}

module.exports = {
  createBaseEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  usageEmbed,
  replyOptions,
  SAFE_MENTIONS,
};
