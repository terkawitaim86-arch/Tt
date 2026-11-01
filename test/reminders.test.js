const test = require('node:test');
const assert = require('node:assert/strict');
const { installMockDb, resetMockDb, mockDb } = require('./helpers/mockDb');

installMockDb();
const { processDueReminders, deliverReminder, buildReminderEmbed, isPermanentDiscordError } = require('../src/utils/reminderRunner');
const { getDueReminders } = require('../src/utils/reminderManager');

function logger() {
  const lines = [];
  return {
    lines,
    log: (...args) => lines.push(args.join(' ')),
    warn: (...args) => lines.push(args.join(' ')),
    error: (...args) => lines.push(args.join(' ')),
  };
}

function fakeClient(sendImpl) {
  const sent = [];
  const channel = {
    id: 'chan-1',
    send: async (payload) => {
      if (sendImpl) await sendImpl(payload);
      sent.push(payload);
      return { id: `sent-${sent.length}` };
    },
  };
  return { sent, client: { channels: { cache: new Map([['chan-1', channel]]) } } };
}

function setupReminderTable(due) {
  const claimed = new Set();
  mockDb.state.handlers.reminders = ({ ops }) => {
    const update = ops.find((op) => op.op === 'update');
    if (update) {
      const patch = update.args[0];
      const id = ops.filter((op) => op.op === 'eq')[0].args[1];
      if (patch.completed === true) {
        if (claimed.has(id)) return { data: [], error: null };
        claimed.add(id);
        return { data: [{ id }], error: null };
      }
      if (patch.completed === false) {
        claimed.delete(id);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    }
    return { data: due, error: null };
  };
  return claimed;
}

const reminder = (id, userId = 'user-1', message = 'secret reminder body') => ({
  id, channel_id: 'chan-1', user_id: userId, message, due_at: new Date().toISOString(),
});

test('a database read failure aborts the tick and is reported, not swallowed', async () => {
  resetMockDb();
  mockDb.state.handlers.reminders = () => ({ data: null, error: { message: 'connection refused' } });
  const log = logger();
  const { client, sent } = fakeClient();

  assert.equal(await getDueReminders(), null, 'read errors must be distinguishable from an empty result');

  const summary = await processDueReminders(client, { logger: log });
  assert.equal(summary.dbFailed, true);
  assert.equal(sent.length, 0);
  assert.ok(log.lines.some((line) => line.includes('could not be read')), 'expected a logged DB error');
});

test('one failing reminder does not stop the others', async () => {
  resetMockDb();
  const due = [reminder('r-1', 'user-bad'), reminder('r-2', 'user-good'), reminder('r-3', 'user-ok')];
  setupReminderTable(due);
  const log = logger();
  const { client, sent } = fakeClient(async (payload) => {
    if (payload.content === '<@user-bad>') {
      const error = new Error('Missing Permissions');
      error.code = 50013;
      throw error;
    }
  });

  const summary = await processDueReminders(client, { logger: log });

  assert.equal(summary.fetched, 3);
  assert.equal(summary.delivered, 2);
  assert.equal(summary.failed, 1);
  assert.equal(sent.length, 2);
  assert.ok(log.lines.some((line) => line.includes('Failed to deliver reminder r-1')));
});

test('permanent Discord failures are not retried forever', async () => {
  resetMockDb();
  setupReminderTable([reminder('r-1')]);
  const { client } = fakeClient(async () => {
    const error = new Error('Unknown Channel');
    error.code = 10003;
    throw error;
  });

  const summary = await processDueReminders(client, { logger: logger() });
  assert.equal(summary.failed, 1);
  assert.equal(summary.retried, 0);
  assert.equal(isPermanentDiscordError({ code: 10003 }), true);
  assert.equal(isPermanentDiscordError({ status: 429 }), false);
});

test('transient failures release the claim so the reminder is retried', async () => {
  resetMockDb();
  const claimed = setupReminderTable([reminder('r-1')]);
  const { client } = fakeClient(async () => {
    const error = new Error('rate limited');
    error.status = 429;
    throw error;
  });

  const summary = await processDueReminders(client, { logger: logger() });
  assert.equal(summary.retried, 1);
  assert.equal(claimed.size, 0, 'the claim must be released for a retry');
});

test('a reminder already claimed by another tick is skipped, not delivered twice', async () => {
  resetMockDb();
  const claimed = setupReminderTable([reminder('r-1')]);
  claimed.add('r-1'); // simulate an overlapping tick / second process
  const { client, sent } = fakeClient();

  const summary = await processDueReminders(client, { logger: logger() });
  assert.equal(summary.skipped, 1);
  assert.equal(summary.delivered, 0);
  assert.equal(sent.length, 0);
});

test('deliverReminder handles a missing channel without throwing', async () => {
  const log = logger();
  const result = await deliverReminder({ channels: { cache: new Map() } }, reminder('r-1'), log);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'channel-unavailable');
  assert.match(log.lines.join('\n'), /channel chan-1 is not available/);
});

test('reminder logs never contain the reminder text or ids of secrets', async () => {
  resetMockDb();
  setupReminderTable([reminder('r-1', 'user-1', 'TOP-SECRET-PAYLOAD')]);
  const log = logger();
  const { client } = fakeClient(async () => {
    const error = new Error('boom');
    error.code = 50013;
    throw error;
  });

  await processDueReminders(client, { logger: log });
  const combined = log.lines.join('\n');
  assert.ok(!combined.includes('TOP-SECRET-PAYLOAD'), 'reminder contents must not be logged');
});

test('the reminder embed mentions the user and keeps the message readable', () => {
  const data = buildReminderEmbed(reminder('r-1', 'user-9', 'drink water')).toJSON();
  assert.equal(data.title, 'Reminder');
  assert.match(data.description, /<@user-9>/);
  assert.match(data.description, /drink water/);
});
