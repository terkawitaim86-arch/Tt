/** Minimal discord.js fakes — just enough surface for the commands under test. */
const { PermissionFlagsBits } = require('discord.js');

function permissions(flags = []) {
  const set = new Set(flags);
  // Mirrors discord.js: holding Administrator implies every permission.
  const granted = (flag) => set.has(flag) || set.has(PermissionFlagsBits.Administrator);
  return {
    has: (flag) => granted(flag),
    any: (list) => list.some((flag) => set.has(flag)),
  };
}

function role(position, name = `role-${position}`) {
  return { id: `role-${position}`, name, position, managed: false, toString: () => name };
}

function member({ id = 'user-1', position = 5, flags = [], tag } = {}) {
  return {
    id,
    user: { id, tag: tag || `${id}#0001`, bot: false, username: id },
    roles: { highest: role(position) },
    permissions: permissions(flags),
    send: async () => {},
  };
}

function collection(items = []) {
  const map = new Map(items.map((item, index) => [item.id ?? String(index), item]));
  return {
    get: (key) => map.get(key),
    first: () => map.values().next().value ?? null,
    filter: (fn) => collection([...map.values()].filter(fn)),
    map: (fn) => [...map.values()].map(fn),
    get size() { return map.size; },
    [Symbol.iterator]: () => map.values(),
    values: () => map.values(),
  };
}

function textChannel({ id = 'chan-1', name = 'general', type = 0 } = {}) {
  const channel = {
    id,
    name,
    type,
    messages: { fetched: [], fetch: async () => collection(channel.messages.fetched) },
    bulkDelete: async (messages) => collection([...messages]),
    setRateLimitPerUser: async () => {},
    permissionOverwrites: { edit: async () => {} },
  };
  return channel;
}

/**
 * Build a fake message.
 * @param {object} options
 * @param {string[]} options.memberFlags  guild permissions of the author
 * @param {string[]} options.botFlags     guild permissions of the bot
 */
function createMessage({
  id = 'msg-1',
  content = '',
  memberFlags = [],
  botFlags = [PermissionFlagsBits.Administrator],
  moderatorPosition = 10,
  targetMember = null,
  targetChannel = null,
  guildId = 'guild-1',
  authorId = 'mod-1',
  channel = textChannel(),
} = {}) {
  const replies = [];
  const bot = member({ id: 'bot-1', position: 50, flags: botFlags });
  const author = member({ id: authorId, position: moderatorPosition, flags: memberFlags });

  const message = {
    id,
    content,
    guild: {
      id: guildId,
      ownerId: 'owner-1',
      members: { me: bot },
      roles: { everyone: { id: 'role-everyone', name: '@everyone' } },
    },
    member: author,
    author: { id: authorId, tag: `${authorId}#0001`, bot: false },
    channel,
    mentions: {
      members: collection(targetMember ? [targetMember] : []),
      channels: collection(targetChannel ? [targetChannel] : []),
      users: collection([]),
    },
    reply: async (payload) => { replies.push(payload); return { id: `reply-${replies.length}` }; },
    _replies: replies,
  };

  return message;
}

function embedText(payload) {
  const embed = payload && payload.embeds && payload.embeds[0];
  if (!embed) return '';
  const data = typeof embed.toJSON === 'function' ? embed.toJSON() : embed;
  const fields = (data.fields || []).map((field) => `${field.name}: ${field.value}`).join('\n');
  return [data.title, data.description, fields].filter(Boolean).join('\n');
}

module.exports = { permissions, role, member, collection, textChannel, createMessage, embedText };
