const test = require('node:test');
const assert = require('node:assert/strict');
const { PermissionFlagsBits } = require('discord.js');
const { guardModeration, hierarchyProblem, describeDiscordError, missingBotPermissions } = require('../src/utils/permissions');
const { createMessage, member } = require('./helpers/discord');

function text(payload) {
  const embed = payload.embeds[0].toJSON();
  return `${embed.title}\n${embed.description}`;
}

test('guardModeration rejects a moderator without the required permission', () => {
  const message = createMessage({ memberFlags: [] });
  const denied = guardModeration(message, {
    permission: PermissionFlagsBits.ManageChannels,
    permissionLabel: 'Manage Channels',
    command: 'lock',
  });
  assert.ok(denied, 'expected a denial embed');
  assert.match(text({ embeds: [denied] }), /Missing permission/);
  assert.match(text({ embeds: [denied] }), /Manage Channels/);
});

test('guardModeration accepts a moderator with the required permission', () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ManageChannels] });
  const denied = guardModeration(message, {
    permission: PermissionFlagsBits.ManageChannels,
    permissionLabel: 'Manage Channels',
  });
  assert.equal(denied, null);
});

test('guardModeration reports missing bot permissions', () => {
  const message = createMessage();
  const denied = guardModeration(message, {
    botPermissions: { 'Manage Roles': PermissionFlagsBits.ManageRoles },
  });
  assert.ok(denied);
  assert.match(text({ embeds: [denied] }), /I am missing permissions/);
  assert.match(text({ embeds: [denied] }), /Manage Roles/);
});

test('guardModeration refuses to act on a member with an equal or higher role', () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ModerateMembers], moderatorPosition: 5 });
  const target = member({ id: 'target-1', position: 5 });
  const denied = guardModeration(message, {
    permission: PermissionFlagsBits.ModerateMembers,
    target,
    actionName: 'timeout',
  });
  assert.ok(denied);
  assert.match(text({ embeds: [denied] }), /Role hierarchy/);
});

test('hierarchyProblem protects the owner, self and the bot', () => {
  const message = createMessage({ memberFlags: [PermissionFlagsBits.ModerateMembers] });
  const guild = message.guild;

  assert.match(hierarchyProblem({ guild, moderator: message.member, target: member({ id: 'mod-1' }) }), /yourself/);
  assert.match(hierarchyProblem({ guild, moderator: message.member, target: member({ id: 'owner-1' }) }), /server owner/);
  assert.match(hierarchyProblem({ guild, moderator: message.member, target: member({ id: 'bot-1' }) }), /myself/);
  assert.equal(hierarchyProblem({ guild, moderator: message.member, target: member({ id: 'target-2', position: 1 }) }), null);
});

test('guardModeration outside a guild returns a server-only error', () => {
  const message = createMessage();
  message.guild = null;
  const denied = guardModeration(message, { permission: PermissionFlagsBits.BanMembers });
  assert.match(text({ embeds: [denied] }), /Server only/);
});

test('describeDiscordError maps known Discord error codes', () => {
  assert.match(describeDiscordError({ code: 50013 }), /permissions/);
  assert.match(describeDiscordError({ code: 50034 }), /14 days/);
  assert.equal(describeDiscordError({ code: 99999 }, 'fallback text'), 'fallback text');
});

test('missingBotPermissions lists every missing flag', () => {
  const message = createMessage();
  message.guild.members.me = member({ id: 'bot-1', flags: [PermissionFlagsBits.ManageChannels] });
  const missing = missingBotPermissions(message.guild, {
    'Manage Channels': PermissionFlagsBits.ManageChannels,
    'Manage Messages': PermissionFlagsBits.ManageMessages,
  });
  assert.deepEqual(missing, ['Manage Messages']);
});
