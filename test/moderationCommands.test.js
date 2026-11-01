const test = require('node:test');
const assert = require('node:assert/strict');
const { PermissionFlagsBits } = require('discord.js');
const { installMockDb, resetMockDb } = require('./helpers/mockDb');

installMockDb();
const clear = require('../src/commands/Moderation/clear');
const lock = require('../src/commands/Moderation/lock');
const slowmode = require('../src/commands/Moderation/slowmode');
const { createMessage, collection, textChannel, embedText } = require('./helpers/discord');

const DAY = 24 * 60 * 60 * 1000;

function fakeMsg(id, { ageMs = 0, pinned = false, authorId = 'user-1' } = {}) {
  return { id, pinned, author: { id: authorId }, createdTimestamp: Date.now() - ageMs };
}

function lastReply(message) {
  return message._replies[message._replies.length - 1];
}

test.beforeEach(() => resetMockDb());

test('clear rejects a non-numeric amount before touching Discord', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageMessages] });
  let fetched = false;
  message.channel.messages.fetch = async () => { fetched = true; return collection([]); };

  for (const input of ['abc', '0', '101', '-5', '', '1.5']) {
    message._replies.length = 0;
    await clear.execute(message, input ? [input] : []);
    assert.match(embedText(lastReply(message)), /Usage: clear/, `input ${JSON.stringify(input)} should be rejected`);
  }
  assert.equal(fetched, false, 'invalid input must not trigger a Discord fetch');
});

test('clear refuses moderators without Manage Messages', async () => {
  const message = createMessage({ memberFlags: [] });
  let fetched = false;
  message.channel.messages.fetch = async () => { fetched = true; return collection([]); };

  await clear.execute(message, ['10']);

  assert.match(embedText(lastReply(message)), /Missing permission/);
  assert.equal(fetched, false);
});

test('clear reports nothing deleted when every message is older than 14 days', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageMessages] });
  message.channel.messages.fetched = [fakeMsg('m1', { ageMs: 15 * DAY }), fakeMsg('m2', { ageMs: 20 * DAY })];
  let bulkDeleteCalled = false;
  message.channel.bulkDelete = async () => { bulkDeleteCalled = true; return collection([]); };

  await clear.execute(message, ['2']);

  assert.match(embedText(lastReply(message)), /Nothing deleted/);
  assert.match(embedText(lastReply(message)), /older than 14 days/);
  assert.equal(bulkDeleteCalled, false, 'Discord would reject the request; do not call bulkDelete');
});

test('clear only passes recent, unpinned messages to bulkDelete and reports the real count', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageMessages] });
  message.channel.messages.fetched = [
    fakeMsg('recent-1', { ageMs: 1000 }),
    fakeMsg('recent-2', { ageMs: 2000 }),
    fakeMsg('pinned', { pinned: true }),
    fakeMsg('old', { ageMs: 16 * DAY }),
  ];
  let received = null;
  message.channel.bulkDelete = async (messages) => { received = messages; return collection([...messages.values()]); };

  await clear.execute(message, ['4']);

  assert.equal(received.size, 2);
  assert.deepEqual([...received.values()].map((m) => m.id).sort(), ['recent-1', 'recent-2']);
  assert.match(embedText(lastReply(message)), /Deleted \*\*2\*\*/);
});

test('clear reports the count Discord actually deleted, not the requested amount', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageMessages] });
  message.channel.messages.fetched = [fakeMsg('a'), fakeMsg('b'), fakeMsg('c')];
  message.channel.bulkDelete = async () => collection([fakeMsg('a')]);

  await clear.execute(message, ['3']);

  const text = embedText(lastReply(message));
  assert.match(text, /Deleted \*\*1\*\*/);
  assert.match(text, /Requested: 3/);
});

test('clear never reports success when bulkDelete fails', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageMessages] });
  message.channel.messages.fetched = [fakeMsg('a'), fakeMsg('b')];
  message.channel.bulkDelete = async () => {
    const error = new Error('You can only bulk delete messages that are under 14 days old.');
    error.code = 50034;
    throw error;
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await clear.execute(message, ['2']);
  } finally {
    console.error = originalError;
  }

  const text = embedText(lastReply(message));
  assert.match(text, /Clear failed/);
  assert.doesNotMatch(text, /Messages cleared/);
});

test('lock refuses moderators without Manage Channels and does not edit overwrites', async () => {
  const message = createMessage({ memberFlags: [] });
  let edited = false;
  message.channel.permissionOverwrites.edit = async () => { edited = true; };

  await lock.execute(message, []);

  assert.match(embedText(lastReply(message)), /Missing permission/);
  assert.equal(edited, false);
});

test('lock reports a Discord API failure instead of success', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageChannels] });
  message.channel.permissionOverwrites.edit = async () => {
    const error = new Error('Missing Permissions');
    error.code = 50013;
    throw error;
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await lock.execute(message, []);
  } finally {
    console.error = originalError;
  }

  const text = embedText(lastReply(message));
  assert.match(text, /Lock failed/);
  assert.doesNotMatch(text, /Channel locked/);
});

test('slowmode rejects out-of-range and non-numeric values', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageChannels] });
  let called = false;
  message.channel.setRateLimitPerUser = async () => { called = true; };

  for (const input of ['21601', '99999', 'abc', '-1', '']) {
    message._replies.length = 0;
    await slowmode.execute(message, input ? [input] : []);
    assert.match(embedText(lastReply(message)), /Usage: slowmode/, `input ${JSON.stringify(input)} should be rejected`);
  }
  assert.equal(called, false);
});

test('slowmode accepts 0 (off) and the maximum', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageChannels] });
  const applied = [];
  message.channel.setRateLimitPerUser = async (seconds) => { applied.push(seconds); };

  await slowmode.execute(message, ['0']);
  message._replies.length = 0;
  await slowmode.execute(message, ['21600']);

  assert.deepEqual(applied, [0, 21600]);
  assert.match(embedText(lastReply(message)), /Slowmode/i);
});

test('slowmode reports a Discord API failure instead of a false success', async () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageChannels] });
  message.channel.setRateLimitPerUser = async () => {
    const error = new Error('Missing Permissions');
    error.code = 50013;
    throw error;
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await slowmode.execute(message, ['10']);
  } finally {
    console.error = originalError;
  }

  assert.match(embedText(lastReply(message)), /Slowmode failed/);
});

test('a text channel lock uses the channel permission overwrites', async () => {
  const channel = textChannel({ id: 'chan-9', name: 'announcements' });
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageChannels], channel });
  let patch = null;
  channel.permissionOverwrites.edit = async (role, values) => { patch = { role, values }; };

  await lock.execute(message, ['raid']);

  assert.equal(patch.role.id, 'role-everyone');
  assert.equal(patch.values.SendMessages, false);
  assert.match(embedText(lastReply(message)), /Channel locked/);
});
