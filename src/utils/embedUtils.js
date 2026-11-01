const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getCommandMeta } = require('./commandMeta');

/**
 * ZMB OFFICIAL — shared embed design system.
 *
 * Every user-facing embed in the bot is produced here so colors, typography
 * hierarchy, spacing and footer styling stay identical across commands.
 */

const BRAND = 'ZMB OFFICIAL';
const PREFIX_FALLBACK = config.defaultPrefix;

const COLORS = Object.freeze({
  primary: 0x5865f2,
  info: 0x4e9cf5,
  success: 0x3ba55d,
  warning: 0xfaa61a,
  error: 0xed4245,
  moderation: 0x9b59b6,
  neutral: 0x99aab5,
});

// Discord's documented embed limits.
const LIMITS = Object.freeze({
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footer: 2048,
  authorName: 256,
  total: 6000,
});

const FOOTER_CONTEXT = Object.freeze({
  command: 'Commands',
  moderation: 'Moderation',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
  log: 'Logging',
});

function normalizeColor(color) {
  if (typeof color === 'number' && Number.isFinite(color)) return color;
  if (typeof color === 'string') {
    const key = color.toLowerCase();
    if (COLORS[key] !== undefined) return COLORS[key];
    const hex = color.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) return Number.parseInt(hex, 16);
  }
  return COLORS.primary;
}

/** Trim text to a Discord-safe length without cutting mid-word when possible. */
function truncate(text, max = LIMITS.description) {
  const source = typeof text === 'string' ? text : text === undefined || text === null ? '' : String(text);
  if (source.length <= max) return source;

  const hardCut = source.slice(0, Math.max(0, max - 1));
  const lastSpace = hardCut.lastIndexOf(' ');
  const softCut = lastSpace > max * 0.6 ? hardCut.slice(0, lastSpace) : hardCut;
  return `${softCut.trimEnd()}…`;
}

/** Inline code span that is safe for arbitrary user content. */
function inlineCode(value) {
  return `\`${String(value ?? '').replace(/`/g, "'")}\``;
}

/** Fenced code block used for command syntax. */
function codeBlock(value) {
  const body = String(value ?? '').replace(/```/g, "'''");
  return `\`\`\`\n${body}\n\`\`\``;
}

/** Strip mentions and formatting from user supplied reasons before echoing them. */
function sanitizeReason(reason, fallback = 'No reason provided') {
  const text = typeof reason === 'string' ? reason.trim() : '';
  if (!text) return fallback;
  return truncate(text.replace(/```/g, "'''"), 512);
}

function brandFooter(context) {
  return context ? `${BRAND} • ${context}` : BRAND;
}

function normalizeFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((field) => field && field.name !== undefined && field.value !== undefined)
    .slice(0, LIMITS.fields)
    .map((field) => ({
      name: truncate(String(field.name), LIMITS.fieldName) || '\u200b',
      value: truncate(String(field.value), LIMITS.fieldValue) || '\u200b',
      inline: Boolean(field.inline),
    }));
}

/**
 * Discord's embed builders throw on any icon/image value that is not an
 * absolute http(s) URL, which would abort the command that produced the embed.
 * Validate first and simply omit the decoration when it is unusable.
 */
function isHttpUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeAuthor(author) {
  if (!author) return null;
  if (typeof author === 'string') return { name: truncate(author, LIMITS.authorName) };
  const normalized = { name: truncate(String(author.name || BRAND), LIMITS.authorName) };
  if (isHttpUrl(author.iconURL)) normalized.iconURL = author.iconURL;
  if (isHttpUrl(author.url)) normalized.url = author.url;
  return normalized;
}

/**
 * Base embed with the shared visual language applied.
 */
function createBaseEmbed({
  title,
  description,
  color = COLORS.primary,
  author,
  footer,
  footerContext,
  thumbnail,
  image,
  fields = [],
  timestamp = true,
} = {}) {
  const embed = new EmbedBuilder().setColor(normalizeColor(color));

  if (title) embed.setTitle(truncate(String(title), LIMITS.title));
  if (description) embed.setDescription(truncate(String(description), LIMITS.description));

  const normalizedAuthor = normalizeAuthor(author);
  if (normalizedAuthor) embed.setAuthor(normalizedAuthor);

  if (footer) {
    embed.setFooter({ text: truncate(String(footer), LIMITS.footer) });
  } else if (footerContext !== null) {
    embed.setFooter({ text: brandFooter(footerContext) });
  }

  if (thumbnail) embed.setThumbnail(String(thumbnail));
  if (image) embed.setImage(String(image));

  const safeFields = normalizeFields(fields);
  if (safeFields.length) embed.addFields(safeFields);

  if (timestamp) embed.setTimestamp();

  return embed;
}

function buildSuccessEmbed({ title = 'Success', description, fields, footer, footerContext = FOOTER_CONTEXT.success, ...rest } = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    footer,
    footerContext,
    color: COLORS.success,
    ...rest,
  });
}

function buildInfoEmbed({ title, description, fields, footer, footerContext = FOOTER_CONTEXT.info, ...rest } = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    footer,
    footerContext,
    color: COLORS.info,
    ...rest,
  });
}

function buildWarningEmbed({ title = 'Heads up', description, fields, footer, footerContext = FOOTER_CONTEXT.warning, ...rest } = {}) {
  return createBaseEmbed({
    title,
    description,
    fields,
    footer,
    footerContext,
    color: COLORS.warning,
    ...rest,
  });
}

/**
 * Error embeds: one short sentence, optional usage/example, never internals.
 */
function buildErrorEmbed({
  title = 'Something went wrong',
  description = 'That action could not be completed.',
  usage,
  example,
  fields = [],
  footer,
  footerContext = FOOTER_CONTEXT.error,
  ...rest
} = {}) {
  const allFields = [...fields];
  if (usage) allFields.push({ name: 'Usage', value: codeBlock(usage), inline: false });
  if (example) allFields.push({ name: 'Example', value: codeBlock(example), inline: false });

  return createBaseEmbed({
    title,
    description,
    fields: allFields,
    footer,
    footerContext,
    color: COLORS.error,
    ...rest,
  });
}

/**
 * Moderation action result embed.
 * The moderator is shown as the author, the affected target as a field, so the
 * two are never confused.
 */
function buildModerationEmbed({
  title,
  description,
  moderator,
  target,
  reason,
  extraFields = [],
  color = COLORS.moderation,
  footerContext = FOOTER_CONTEXT.moderation,
  footer,
  thumbnail,
  ...rest
} = {}) {
  const fields = [];

  if (target) {
    const id = target.id || target;
    const tag = target.tag || target.user?.tag;
    fields.push({
      name: 'Target',
      value: tag ? `${inlineCode(id)} (${truncate(tag, 64)})` : inlineCode(id),
      inline: false,
    });
  }

  fields.push(...extraFields);

  if (reason !== undefined) {
    fields.push({ name: 'Reason', value: sanitizeReason(reason), inline: false });
  }

  const author = moderator
    ? {
        name: `Moderator: ${typeof moderator === 'string' ? moderator : moderator.tag || moderator.user?.tag || moderator.id || 'Unknown'}`,
        iconURL:
          typeof moderator === 'object'
            ? moderator.displayAvatarURL?.({ size: 128 }) || moderator.user?.displayAvatarURL?.({ size: 128 })
            : undefined,
      }
    : undefined;

  return createBaseEmbed({
    title,
    description,
    fields,
    author,
    thumbnail:
      thumbnail ||
      (typeof target === 'object' && target
        ? target.displayAvatarURL?.({ size: 128 }) || target.user?.displayAvatarURL?.({ size: 128 })
        : undefined),
    color,
    footer,
    footerContext,
    ...rest,
  });
}

function formatArguments(args) {
  if (!Array.isArray(args) || args.length === 0) return null;

  return args
    .map((arg) => {
      const label = arg.required ? `\`<${arg.name}>\`` : `\`[${arg.name}]\``;
      const requirement = arg.required ? 'required' : 'optional';
      const description = truncate(arg.description || '', 200);
      return `${label} · ${requirement} — ${description}`;
    })
    .join('\n');
}

function resolveMeta(command) {
  if (!command) return null;
  return getCommandMeta(command.name) || null;
}

/**
 * Standard command usage embed:
 * title → short description → usage → arguments → example → permissions → aliases.
 */
function buildCommandEmbed(command, prefix = PREFIX_FALLBACK, options = {}) {
  if (!command) return buildErrorEmbed({ description: 'That command could not be found.' });

  const meta = resolveMeta(command) || {};
  const syntax = `${prefix}${command.usage || command.name}`;
  const examples = meta.examples?.length ? meta.examples : [syntax];
  const exampleText = examples
    .map((example) => (example.startsWith(prefix) ? example : `${prefix}${example}`))
    .join('\n');

  const fields = [{ name: 'Usage', value: codeBlock(syntax), inline: false }];

  const argumentsText = formatArguments(meta.arguments);
  if (argumentsText) fields.push({ name: 'Arguments', value: argumentsText, inline: false });

  fields.push({ name: 'Example', value: codeBlock(exampleText), inline: false });

  if (meta.permissions) {
    fields.push({ name: 'Permissions', value: truncate(meta.permissions, LIMITS.fieldValue), inline: false });
  }

  if (Array.isArray(command.aliases) && command.aliases.length > 0) {
    fields.push({
      name: 'Aliases',
      value: command.aliases.map((alias) => inlineCode(`${prefix}${alias}`)).join(', '),
      inline: false,
    });
  }

  const category = command.category || meta.category;
  const footer = truncate(`${BRAND} • Prefix ${prefix}${category ? ` • ${category}` : ''}`, LIMITS.footer);

  return createBaseEmbed({
    title: `${prefix}${command.name}`,
    description: truncate(command.description || 'No description available.', LIMITS.description),
    fields,
    footer,
    color: COLORS.primary,
    ...options,
  });
}

/**
 * Error embed for invalid command input: problem + correct usage + example.
 */
function buildUsageErrorEmbed(command, prefix = PREFIX_FALLBACK, problem, options = {}) {
  const { title, example: exampleOption, ...rest } = options;
  const meta = resolveMeta(command) || {};
  const syntax = command ? `${prefix}${command.usage || command.name}` : undefined;
  const exampleSource = exampleOption || meta.examples?.[0];
  const example = exampleSource
    ? exampleSource.startsWith(prefix)
      ? exampleSource
      : `${prefix}${exampleSource}`
    : syntax;

  return buildErrorEmbed({
    title: title || (command ? `Invalid ${prefix}${command.name} arguments` : 'Invalid usage'),
    description: truncate(problem || 'That input was not valid for this command.', LIMITS.description),
    usage: syntax,
    example,
    footerContext: FOOTER_CONTEXT.command,
    ...rest,
  });
}

/**
 * Reply helper: converts any error path into a consistent error embed.
 */
async function replyError(message, { description, title, usage, example, command, prefix = PREFIX_FALLBACK } = {}) {
  if (command) {
    return message.reply({
      embeds: [buildUsageErrorEmbed(command, prefix, description, { title, example })],
    });
  }

  return message.reply({
    embeds: [buildErrorEmbed({ title, description, usage, example })],
  });
}

/**
 * Safe error logging: full detail stays in the console, members only see a
 * generic sentence.
 */
function logCommandError(label, error) {
  const detail = error && error.stack ? error.stack : String(error);
  console.error(`[${label}] ${detail}`);
}

module.exports = {
  BRAND,
  COLORS,
  LIMITS,
  FOOTER_CONTEXT,
  normalizeColor,
  truncate,
  inlineCode,
  codeBlock,
  sanitizeReason,
  brandFooter,
  createBaseEmbed,
  successEmbed: buildSuccessEmbed,
  infoEmbed: buildInfoEmbed,
  warningEmbed: buildWarningEmbed,
  errorEmbed: buildErrorEmbed,
  moderationEmbed: buildModerationEmbed,
  commandEmbed: buildCommandEmbed,
  usageErrorEmbed: buildUsageErrorEmbed,
  replyError,
  logCommandError,
};
