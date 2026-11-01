const test = require('node:test');
const assert = require('node:assert/strict');
const { installMockDb, resetMockDb, mockDb } = require('./helpers/mockDb');

installMockDb();
const { xpForLevel, levelForXp, addXp } = require('../src/utils/xpManager');

test('xpForLevel follows the quadratic curve', () => {
  assert.equal(xpForLevel(0), 100);
  assert.equal(xpForLevel(1), 155);
  assert.equal(xpForLevel(2), 220);
  assert.equal(xpForLevel(10), 1100);
});

test('levelForXp converts totals into level progress', () => {
  assert.deepEqual(levelForXp(0), { level: 0, currentXp: 0, neededXp: 100 });
  assert.deepEqual(levelForXp(99), { level: 0, currentXp: 99, neededXp: 100 });
  assert.deepEqual(levelForXp(100), { level: 1, currentXp: 0, neededXp: 155 });
  assert.deepEqual(levelForXp(255), { level: 2, currentXp: 0, neededXp: 220 });
  assert.equal(levelForXp(10000).level > 0, true);
});

test('addXp delegates the increment to the atomic database function', async () => {
  resetMockDb();
  let total = 0;
  mockDb.state.handlers['rpc:add_xp'] = ({ ops }) => {
    const amount = ops[0].args[1].p_amount;
    total += amount;
    return { data: [{ xp: total, level: levelForXp(total).level }], error: null };
  };

  const result = await addXp('guild-1', 'user-1', 100);

  assert.equal(result.xp, 100);
  assert.equal(result.level, 1);
  assert.equal(result.currentXp, 0);
  assert.equal(result.neededXp, 155);
  assert.equal(result.leveledUp, true);

  const tables = mockDb.state.calls.map((call) => call.table);
  assert.deepEqual(tables, ['rpc:add_xp'], 'addXp must not read-then-write xp_data');
  assert.equal(mockDb.state.calls[0].ops[0].args[1].p_guild_id, 'guild-1');
});

test('addXp reports a database failure instead of pretending success', async () => {
  resetMockDb();
  mockDb.state.handlers['rpc:add_xp'] = () => ({ data: null, error: { message: 'permission denied' } });
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal(await addXp('guild-1', 'user-1', 10), null);
  } finally {
    console.error = originalError;
  }
});

test('concurrent addXp calls never lose XP', async () => {
  resetMockDb();
  let total = 0;
  // Mirrors the SQL function: a single atomic statement serialised by Postgres.
  mockDb.state.handlers['rpc:add_xp'] = ({ ops }) => {
    const amount = ops[0].args[1].p_amount;
    total += amount;
    return { data: [{ xp: total, level: levelForXp(total).level }], error: null };
  };

  const calls = Array.from({ length: 50 }, () => addXp('guild-1', 'user-1', 10));
  const results = await Promise.all(calls);

  assert.equal(results.filter(Boolean).length, 50);
  assert.equal(total, 500);
  assert.equal(Math.max(...results.map((r) => r.xp)), 500);
  assert.equal(new Set(results.map((r) => r.xp)).size, 50, 'every update must observe a distinct running total');
});
