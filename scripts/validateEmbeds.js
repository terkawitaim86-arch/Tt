#!/usr/bin/env node
/**
 * Validates the ZMB OFFICIAL embed design system.
 *
 * Loads every command and event module (proving the shared builders and imports
 * resolve), builds the embeds each command would render, and asserts that every
 * embed respects Discord's documented limits and the project's layout contract.
 *
 * Exits non-zero on the first failure so it can be used as a CI check.
 */

// Minimal config so modules that read the environment at require time load.
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'validation-anon-key';

const fs = require('fs');
const path = require('path');
const Module = require('module');

// @supabase/supabase-js needs a native WebSocket (Node 22+). On older runtimes the
// module cannot even be imported, so the offline validator substitutes a stub —
// this only affects this validation run, never the running bot.
if (typeof globalThis.WebSocket === 'undefined') {
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === '@supabase/supabase-js') {
      return {
        createClient: () => ({
          from: () => ({
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          }),
        }),
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
}

const ROOT = path.resolve(__dirname, '..');
const PREFIX = ',';

const {
  BRAND,
  COLORS,
  LIMITS,
  FOOTER_CONTEXT,
  commandEmbed,
  moderationEmbed,
  errorEmbed,
  usageErrorEmbed,
  infoEmbed,
  successEmbed,
  warningEmbed,
  createBaseEmbed,
} = require(path.join(ROOT, 'src/utils/embedUtils'));
const { COMMAND_META, getCommandMeta } = require(path.join(ROOT, 'src/utils/commandMeta'));

const failures = [];
let checks = 0;

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  checks += 1;
  if (!condition) fail(message);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

/** Discord embed limits (https://discord.com/developers/docs/resources/message#embed-object). */
function checkEmbedLimits(label, embed) {
  const json = typeof embed.toJSON === 'function' ? embed.toJSON() : embed;

  if (json.title !== undefined) {
    assert(json.title.length <= LIMITS.title, `${label}: title exceeds ${LIMITS.title} chars`);
  }
  if (json.description !== undefined) {
    assert(
      json.description.length <= LIMITS.description,
      `${label}: description exceeds ${LIMITS.description} chars`
    );
  }
  if (json.footer?.text !== undefined) {
    assert(json.footer.text.length <= LIMITS.footer, `${label}: footer exceeds ${LIMITS.footer} chars`);
  }
  if (json.author?.name !== undefined) {
    assert(json.author.name.length <= 256, `${label}: author name exceeds 256 chars`);
  }

  const fields = json.fields || [];
  assert(fields.length <= 25, `${label}: ${fields.length} fields exceeds the 25 field limit`);

  for (const field of fields) {
    assert(
      typeof field.name === 'string' && field.name.length > 0 && field.name.length <= 256,
      `${label}: field "${field.name}" name length invalid`
    );
    assert(
      typeof field.value === 'string' && field.value.length > 0 && field.value.length <= LIMITS.fieldValue,
      `${label}: field "${field.name}" value exceeds ${LIMITS.fieldValue} chars`
    );
  }

  const total =
    (json.title || '').length +
    (json.description || '').length +
    (json.footer?.text || '').length +
    (json.author?.name || '').length +
    fields.reduce((sum, field) => sum + field.name.length + field.value.length, 0);
  assert(total <= 6000, `${label}: total embed length ${total} exceeds the 6000 char limit`);

  // No internal detail should ever reach members.
  const serialized = JSON.stringify(json).toLowerCase();
  assert(!serialized.includes('stack trace'), `${label}: embed mentions a stack trace`);
  assert(!/at\s+\w+\s+\(.*:\d+:\d+\)/.test(serialized), `${label}: embed contains a stack frame`);
  assert(!serialized.includes('supabase'), `${label}: embed references internal infrastructure`);

  return json;
}

function fieldNames(json) {
  return (json.fields || []).map((field) => field.name);
}

// ---------------------------------------------------------------------------
// 1. Load every command module.
// ---------------------------------------------------------------------------
const commandFiles = walk(path.join(ROOT, 'src/commands'));
const commands = [];

for (const file of commandFiles) {
  const label = path.relative(ROOT, file);
  try {
    const command = require(file);
    assert(typeof command.name === 'string' && command.name.length > 0, `${label}: missing name`);
    assert(typeof command.description === 'string', `${label}: missing description`);
    assert(typeof command.execute === 'function', `${label}: missing execute()`);
    assert(typeof command.category === 'string', `${label}: missing category`);
    commands.push(command);
  } catch (error) {
    fail(`${label}: failed to load — ${error.message}`);
  }
}

assert(commands.length === commandFiles.length, 'not every command module loaded');
assert(commands.length > 0, 'no commands discovered');

// --------------------------------------------------------------------------->
// 2. Every command must have metadata and a valid usage embed.
// --------------------------------------------------------------------------->
for (const command of commands) {
  const meta = getCommandMeta(command.name);
  assert(!!meta, `${command.name}: missing entry in COMMAND_META`);

  const embed = checkEmbedLimits(`commandEmbed(${command.name})`, commandEmbed(command, PREFIX));
  const names = fieldNames(embed);

  assert(names.includes('Usage'), `${command.name}: usage embed missing "Usage" field`);
  assert(names.includes('Example'), `${command.name}: usage embed missing "Example" field`);

  const usageField = (embed.fields || []).find((field) => field.name === 'Usage');
  assert(
    usageField && usageField.value.includes(`${PREFIX}${command.usage || command.name}`),
    `${command.name}: Usage field does not show the real syntax`
  );
  assert(
    usageField && usageField.value.includes('```'),
    `${command.name}: Usage field must be a code block`
  );

  if (meta && Array.isArray(meta.arguments) && meta.arguments.length > 0) {
    assert(names.includes('Arguments'), `${command.name}: arguments exist but no "Arguments" field`);
    const argsField = (embed.fields || []).find((field) => field.name === 'Arguments');
    for (const arg of meta.arguments) {
      const expected = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
      assert(
        argsField && argsField.value.includes(expected),
        `${command.name}: argument "${arg.name}" should render as ${expected}`
      );
    }
  }

  if (meta && meta.permissions) {
    assert(names.includes('Permissions'), `${command.name}: permissions exist but no "Permissions" field`);
  } else {
    assert(!names.includes('Permissions'), `${command.name}: unexpected "Permissions" field`);
  }

  const hasAliases = Array.isArray(command.aliases) && command.aliases.length > 0;
  assert(
    hasAliases === names.includes('Aliases'),
    `${command.name}: "Aliases" field must appear only when aliases exist`
  );

  if (hasAliases) {
    const aliasField = (embed.fields || []).find((field) => field.name === 'Aliases');
    for (const alias of command.aliases) {
      assert(
        aliasField.value.includes(`${PREFIX}${alias}`),
        `${command.name}: alias "${alias}" not rendered with the prefix`
      );
    }
  }

  assert(
    embed.footer && embed.footer.text === `${BRAND} • Prefix ${PREFIX}${command.category ? ` • ${command.category}` : ''}`,
    `${command.name}: footer does not follow the shared style`
  );
  assert(embed.color === COLORS.primary, `${command.name}: usage embed should use the primary color`);

  // Invalid-argument embed for the same command.
  const usageError = checkEmbedLimits(
    `usageErrorEmbed(${command.name})`,
    usageErrorEmbed(command, PREFIX, 'That input was not valid for this command.')
  );
  const errorNames = fieldNames(usageError);
  assert(errorNames.includes('Usage'), `${command.name}: usage error missing "Usage" field`);
  assert(errorNames.includes('Example'), `${command.name}: usage error missing "Example" field`);
  assert(usageError.color === COLORS.error, `${command.name}: usage error should use the error color`);
}

// ---------------------------------------------------------------------------
// 3. Metadata coverage and shape.
// ---------------------------------------------------------------------------
const commandNames = new Set(commands.map((command) => command.name));
for (const name of Object.keys(COMMAND_META)) {
  assert(commandNames.has(name), `COMMAND_META: "${name}" has no matching command module`);
}
for (const [name, meta] of Object.entries(COMMAND_META)) {
  assert(typeof meta === 'object' && meta !== null, `${name}: metadata must be an object`);
  // Category lives on the command module itself (checked in step 1); metadata
  // intentionally only carries argument/example/permission details.
  if (meta.arguments !== undefined) {
    assert(Array.isArray(meta.arguments), `${name}: metadata arguments must be an array`);
    for (const arg of meta.arguments) {
      assert(typeof arg.name === 'string', `${name}: metadata argument missing name`);
      assert(typeof arg.required === 'boolean', `${name}: metadata argument "${arg.name}" needs required`);
      assert(typeof arg.description === 'string', `${name}: metadata argument "${arg.name}" needs description`);
    }
  }
  if (meta.examples !== undefined) {
    assert(Array.isArray(meta.examples) && meta.examples.length > 0, `${name}: examples must be a non-empty array`);
  }
}

// ---------------------------------------------------------------------------
// 4. Shared builders render valid, consistent embeds.
// ---------------------------------------------------------------------------
const sampleTarget = {
  id: '123456789012345678',
  tag: 'example-user#0001',
  displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
};
const sampleModerator = {
  tag: 'moderator#0001',
  displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png',
};

const moderation = checkEmbedLimits(
  'moderationEmbed(sample)',
  moderationEmbed({
    title: 'Member Banned',
    description: 'The member was banned from the server.',
    moderator: sampleModerator,
    target: sampleTarget,
    reason: 'Repeated rule breaking',
  })
);
assert(moderation.color === COLORS.moderation, 'moderationEmbed: should use the moderation color');
assert(moderation.author?.name?.startsWith('Moderator:'), 'moderationEmbed: moderator must be the author');
assert(fieldNames(moderation).includes('Target'), 'moderationEmbed: target must be a field');
assert(fieldNames(moderation).includes('Reason'), 'moderationEmbed: reason must be shown');
assert(!!moderation.timestamp, 'moderationEmbed: timestamp must be set');
assert(
  moderation.footer?.text === `ZMB OFFICIAL • Moderation` || moderation.footer?.text.includes(BRAND),
  'moderationEmbed: footer must follow the shared style'
);

const noReason = checkEmbedLimits(
  'moderationEmbed(no reason)',
  moderationEmbed({ title: 'Warning Issued', target: sampleTarget, moderator: sampleModerator, reason: '' })
);
assert(
  fieldNames(noReason).includes('Reason'),
  'moderationEmbed: empty reason should still render a Reason field'
);

const errors = [
  ['errorEmbed(default)', errorEmbed()],
  ['errorEmbed(with usage)', errorEmbed({ description: 'Missing member.', usage: ',ban <@member> [reason]', example: ',ban @user spamming' })],
  ['infoEmbed', infoEmbed({ title: 'Info', description: 'Informational message.' })],
  ['successEmbed', successEmbed({ description: 'Action completed.' })],
  ['warningEmbed', warningEmbed({ description: 'Please slow down.' })],
  ['createBaseEmbed(minimal)', createBaseEmbed({ description: 'Minimal body.' })],
];

for (const [label, embed] of errors) {
  const json = checkEmbedLimits(label, embed);
  assert(json.color !== undefined, `${label}: missing color`);
  assert(json.footer?.text?.includes(BRAND), `${label}: missing shared footer`);
}

const longReason = 'x'.repeat(5000);
const longEmbed = checkEmbedLimits(
  'truncation(long content)',
  createBaseEmbed({
    title: 't'.repeat(400),
    description: longReason,
    fields: [{ name: 'Reason', value: longReason }],
    footerContext: FOOTER_CONTEXT.log,
  })
);
assert(longEmbed.title.length === LIMITS.title, 'createBaseEmbed: title was not truncated to the limit');
assert(
  longEmbed.description.length === LIMITS.description,
  'createBaseEmbed: description was not truncated to the limit'
);
assert(
  longEmbed.fields[0].value.length === LIMITS.fieldValue,
  'createBaseEmbed: field value was not truncated to the limit'
);

// ---------------------------------------------------------------------------
// 5. Load every event module so broken imports are caught here.
// ---------------------------------------------------------------------------
const eventFiles = walk(path.join(ROOT, 'src/events'));
for (const file of eventFiles) {
  const label = path.relative(ROOT, file);
  try {
    const event = require(file);
    assert(typeof event.name === 'string' && event.name.length > 0, `${label}: missing name`);
    assert(typeof event.execute === 'function', `${label}: missing execute()`);
  } catch (error) {
    fail(`${label}: failed to load — ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// 6. Report.
// ---------------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`Embed validation FAILED (${failures.length} of ${checks} assertions)\n`);
  for (const failure of failures) console.error(`  • ${failure}`);
  process.exit(1);
}

console.log(
  `Embed validation OK — ${commands.length} commands, ${eventFiles.length} events, ${checks} assertions passed.`
);
