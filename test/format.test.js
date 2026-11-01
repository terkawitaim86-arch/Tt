const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatNumber, truncate, progressBar, progressPercent, positionLabel, formatDuration, clamp,
} = require('../src/utils/format');

test('formatNumber adds thousands separators and never renders NaN', () => {
  assert.equal(formatNumber(12345), '12,345');
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(-2500), '-2,500');
  assert.equal(formatNumber('abc'), '0');
  assert.equal(formatNumber(undefined), '0');
});

test('truncate keeps short text and shortens long text to the limit', () => {
  assert.equal(truncate('hello', 10), 'hello');
  const long = 'x'.repeat(50);
  const cut = truncate(long, 20);
  assert.equal(cut.length, 20);
  assert.ok(cut.endsWith('…'));
});

test('progressBar fills proportionally and stays inside its bounds', () => {
  assert.equal(progressBar(0, 100, 10), '░░░░░░░░░░');
  assert.equal(progressBar(50, 100, 10), '█████░░░░░');
  assert.equal(progressBar(100, 100, 10), '██████████');
  assert.equal(progressBar(500, 100, 10), '██████████');
  assert.equal(progressBar(10, 0, 10), '██████████');
});

test('progressPercent clamps to 0-100', () => {
  assert.equal(progressPercent(25, 100), 25);
  assert.equal(progressPercent(300, 100), 100);
  assert.equal(progressPercent(-5, 100), 0);
});

test('positionLabel returns medals then numbered positions', () => {
  assert.equal(positionLabel(0), '🥇');
  assert.equal(positionLabel(1), '🥈');
  assert.equal(positionLabel(2), '🥉');
  assert.equal(positionLabel(3), '#4');
});

test('formatDuration renders compact human durations', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(90), '1m 30s');
  assert.equal(formatDuration(3661), '1h 1m 1s');
  assert.equal(formatDuration(86400), '1d');
});

test('clamp bounds values', () => {
  assert.equal(clamp(5, 1, 10), 5);
  assert.equal(clamp(0, 1, 10), 1);
  assert.equal(clamp(50, 1, 10), 10);
});
