/**
 * Small, dependency-free formatting helpers shared by embeds.
 * Kept separate from embed construction so they can be unit tested directly.
 */

const MEDALS = ['🥇', '🥈', '🥉'];

/** 12345 -> "12,345" (stable, locale independent for tests). */
function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Clamp a value into [min, max]. */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Render a textual progress bar, e.g. "██████░░░░".
 * @param {number} current  progress value
 * @param {number} needed   total required for the next step
 * @param {number} size     number of segments
 */
function progressBar(current, needed, size = 10) {
  const segments = Math.max(1, Math.trunc(size));
  const total = Number(needed) > 0 ? Number(needed) : 1;
  const ratio = clamp(Number(current) / total, 0, 1);
  const filled = clamp(Math.round(ratio * segments), 0, segments);
  return '█'.repeat(filled) + '░'.repeat(segments - filled);
}

/** Percentage (integer) of progress, clamped to 0-100. */
function progressPercent(current, needed) {
  const total = Number(needed) > 0 ? Number(needed) : 1;
  return clamp(Math.round((Number(current) / total) * 100), 0, 100);
}

/** Medal for the first three spots, otherwise "4." style position. */
function positionLabel(index) {
  if (index < MEDALS.length) return MEDALS[index];
  return `#${index + 1}`;
}

/** Truncate long free text so embeds stay readable on mobile. */
function truncate(text, max = 1024) {
  const str = typeof text === 'string' ? text : String(text ?? '');
  if (str.length <= max) return str;
  return `${str.slice(0, Math.max(0, max - 1))}…`;
}

/** "user#1234" / display name fallback. */
function displayUser(user, fallbackId) {
  if (!user) return fallbackId ? `<@${fallbackId}>` : 'Unknown user';
  if (user.tag) return user.tag;
  if (user.username) return user.username;
  return fallbackId ? `<@${fallbackId}>` : 'Unknown user';
}

/** "1m 30s" style duration from seconds. */
function formatDuration(seconds) {
  const total = Math.max(0, Math.trunc(Number(seconds) || 0));
  if (total === 0) return '0s';
  const parts = [];
  const units = [
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1],
  ];
  let rest = total;
  for (const [suffix, size] of units) {
    if (rest >= size) {
      const value = Math.floor(rest / size);
      rest -= value * size;
      parts.push(`${value}${suffix}`);
    }
  }
  return parts.join(' ');
}

module.exports = {
  MEDALS,
  formatNumber,
  clamp,
  progressBar,
  progressPercent,
  positionLabel,
  truncate,
  displayUser,
  formatDuration,
};
