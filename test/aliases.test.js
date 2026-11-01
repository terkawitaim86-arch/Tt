const test = require('node:test');
const assert = require('node:assert/strict');
const { installMockDb } = require('./helpers/mockDb');

installMockDb();
const { loadCommands } = require('../src/handlers/commandHandler');

function load() {
  const client = { commands: new Map() };
  const originalLog = console.log;
  console.log = () => {};
  try {
    loadCommands(client);
  } finally {
    console.log = originalLog;
  }
  return client.commands;
}

const commands = load();

test('every documented short alias resolves to its full command', () => {
  const expected = { b: 'ban', k: 'kick', c: 'clear', to: 'timeout', w: 'warn' };
  for (const [alias, name] of Object.entries(expected)) {
    const command = commands.get(alias);
    assert.ok(command, `alias ,${alias} is not registered`);
    assert.equal(command.name, name, `alias ,${alias} should run ${name}`);
    assert.equal(command, commands.get(name), 'alias and command must be the same object');
    assert.equal(typeof command.execute, 'function');
  }
});

test('no alias shadows a real command name', () => {
  for (const [key, command] of commands) {
    if (command.name === key) continue;
    assert.ok(commands.has(command.name), `alias ${key} points at an unregistered command ${command.name}`);
  }
});

test('moderation commands keep their permission guards after aliasing', () => {
  for (const alias of ['b', 'k', 'c', 'to', 'w']) {
    const command = commands.get(alias);
    assert.ok(command, `missing alias ${alias}`);
    const source = command.execute.toString();
    assert.match(source, /guardModeration|hasPermission|PermissionFlagsBits/,
      `${command.name} must still check permissions when invoked via ,${alias}`);
  }
});

test('loading registers commands and aliases without duplicates', () => {
  assert.ok(commands.size > 1);
  const names = [...commands.keys()];
  assert.equal(new Set(names).size, names.length);
});
