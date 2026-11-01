const test = require('node:test');
const assert = require('node:assert/strict');
const {
  successEmbed, errorEmbed, warningEmbed, infoEmbed, usageEmbed, replyOptions, createBaseEmbed,
} = require('../src/utils/embedUtils');

function json(embed) {
  return typeof embed.toJSON === 'function' ? embed.toJSON() : embed;
}

test('successEmbed carries title, description, fields and green colour', () => {
  const data = json(successEmbed({ title: 'Done', description: 'ok', fields: [{ name: 'A', value: '1' }] }));
  assert.equal(data.title, 'Done');
  assert.equal(data.description, 'ok');
  assert.equal(data.color, 0x57f287);
  assert.equal(data.fields.length, 1);
  assert.equal(data.footer.text, 'ZMB • Success');
});

test('errorEmbed defaults to a red failure embed', () => {
  const data = json(errorEmbed({}));
  assert.equal(data.title, 'Action failed');
  assert.equal(data.color, 0xef4444);
  assert.equal(data.footer.text, 'ZMB • Error');
});

test('warningEmbed and infoEmbed use their own colours', () => {
  assert.equal(json(warningEmbed({})).color, 0xfbbf24);
  assert.equal(json(infoEmbed({})).color, 0x5865f2);
});

test('usageEmbed documents syntax and example', () => {
  const data = json(usageEmbed({ command: 'clear', syntax: ',clear 5', example: ',clear 5 @user' }));
  assert.equal(data.title, 'Usage: clear');
  const names = data.fields.map((field) => field.name);
  assert.deepEqual(names, ['Syntax', 'Example']);
  assert.ok(data.fields[0].value.includes(',clear 5'));
});

test('createBaseEmbed normalises hex strings and ignores empty values', () => {
  const data = json(createBaseEmbed({ title: 'T', color: '#ff0000' }));
  assert.equal(data.color, 0xff0000);
  assert.equal(data.description, undefined);
});

test('replyOptions never allows mentions to ping', () => {
  const payload = replyOptions(successEmbed({ title: 'x' }), null, [errorEmbed({ title: 'y' })]);
  assert.equal(payload.embeds.length, 2);
  assert.deepEqual(payload.allowedMentions.parse, []);
  assert.equal(payload.allowedMentions.repliedUser, false);
});
