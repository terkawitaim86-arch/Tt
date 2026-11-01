const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const {
  getDueReminders,
  claimReminder,
  releaseReminder,
} = require('./reminderManager');

/** Discord errors that will never succeed if retried (missing channel/permissions). */
const PERMANENT_ERROR_CODES = new Set([10003, 10004, 10013, 50001, 50013, 50035]);

function isPermanentDiscordError(error) {
  if (!error) return false;
  if (error.code && PERMANENT_ERROR_CODES.has(error.code)) return true;
  return error.status >= 400 && error.status < 500 && error.status !== 429;
}

function buildReminderEmbed(reminder) {
  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('Reminder')
    .setDescription(`<@${reminder.user_id}>, you asked me to remind you:\n\n${reminder.message}`)
    .setTimestamp();
}

/**
 * Deliver a single reminder.
 * Logs use the reminder id and guild/user ids only — never the reminder text.
 */
async function deliverReminder(client, reminder, logger = console) {
  const channel = client && client.channels && client.channels.cache
    ? client.channels.cache.get(reminder.channel_id)
    : null;

  if (!channel || typeof channel.send !== 'function') {
    logger.warn(`[Reminders] Skipping reminder ${reminder.id}: channel ${reminder.channel_id} is not available.`);
    return { ok: false, retryable: false, reason: 'channel-unavailable' };
  }

  try {
    await channel.send({
      content: `<@${reminder.user_id}>`,
      embeds: [buildReminderEmbed(reminder)],
      allowedMentions: { users: [reminder.user_id], parse: [] },
    });
    return { ok: true };
  } catch (error) {
    const retryable = !isPermanentDiscordError(error);
    logger.error(
      `[Reminders] Failed to deliver reminder ${reminder.id} in channel ${reminder.channel_id}:`,
      error && (error.message || error)
    );
    return { ok: false, retryable, reason: 'send-failed' };
  }
}

/**
 * One pass of the reminder loop.
 *
 * - Each reminder is isolated: a failure on one never aborts the rest.
 * - A reminder is claimed in the database before delivery, which prevents
 *   duplicate sends from overlapping ticks.
 * - Transient failures release the claim so the next tick retries; permanent
 *   failures keep the claim so a broken channel is not retried forever.
 * - Database failures are logged and reported in the summary; they are never
 *   swallowed silently.
 */
async function processDueReminders(client, { logger = console, limit = 10 } = {}) {
  const summary = { fetched: 0, delivered: 0, skipped: 0, failed: 0, retried: 0, dbFailed: false };

  const due = await getDueReminders(limit);

  if (due === null) {
    summary.dbFailed = true;
    logger.error('[Reminders] Reminder tick aborted: due reminders could not be read from the database.');
    return summary;
  }

  summary.fetched = due.length;

  for (const reminder of due) {
    try {
      const claimed = await claimReminder(reminder.id);
      if (!claimed) {
        summary.skipped++;
        continue;
      }

      const result = await deliverReminder(client, reminder, logger);

      if (result.ok) {
        summary.delivered++;
        continue;
      }

      if (result.retryable) {
        summary.retried++;
        await releaseReminder(reminder.id);
      } else {
        summary.failed++;
      }
    } catch (error) {
      summary.failed++;
      logger.error(`[Reminders] Unexpected error while handling reminder ${reminder.id}:`, error && (error.message || error));
    }
  }

  if (summary.fetched > 0) {
    logger.log(
      `[Reminders] Tick finished: ${summary.delivered} delivered, ${summary.skipped} already claimed, ` +
        `${summary.retried} retrying, ${summary.failed} dropped (of ${summary.fetched}).`
    );
  }

  return summary;
}

module.exports = {
  processDueReminders,
  deliverReminder,
  buildReminderEmbed,
  isPermanentDiscordError,
  PERMANENT_ERROR_CODES,
};
