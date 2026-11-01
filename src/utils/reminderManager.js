const supabase = require('./db');

const TIME_UNITS = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

function parseDuration(input) {
  if (typeof input !== 'string') return null;
  const match = /^(\d+)([smhdw])$/.exec(input.trim().toLowerCase());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2];
  return { seconds: value * TIME_UNITS[unit], display: `${value}${unit}` };
}

async function createReminder({ guildId, channelId, userId, message, dueAt }) {
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      guild_id: guildId,
      channel_id: channelId,
      user_id: userId,
      message,
      due_at: dueAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Reminders] Failed to create:', error.message);
    return null;
  }

  return data.id;
}

/**
 * Fetch reminders that are due now.
 * Returns `null` when the query itself failed so callers can tell "nothing due"
 * apart from "the database is unreachable".
 */
async function getDueReminders(limit = 10) {
  const { data, error } = await supabase
    .from('reminders')
    .select('id, channel_id, user_id, message, due_at')
    .eq('completed', false)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Reminders] Failed to fetch due reminders:', error.message);
    return null;
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Atomically claim a reminder before delivering it.
 * Only one runner can flip `completed` from false to true, so a second tick (or a
 * second process) will never deliver the same reminder twice.
 * @returns {boolean} true when this caller won the claim
 */
async function claimReminder(id) {
  const { data, error } = await supabase
    .from('reminders')
    .update({ completed: true })
    .eq('id', id)
    .eq('completed', false)
    .select('id');

  if (error) {
    console.error('[Reminders] Failed to claim reminder:', error.message);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

/** Release a claim so a reminder can be retried after a transient failure. */
async function releaseReminder(id) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed: false })
    .eq('id', id);

  if (error) {
    console.error('[Reminders] Failed to release reminder:', error.message);
    return false;
  }

  return true;
}

async function markReminderComplete(id) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed: true })
    .eq('id', id);

  if (error) {
    console.error('[Reminders] Failed to mark complete:', error.message);
    return false;
  }

  return true;
}

async function getUserReminders(guildId, userId) {
  const { data, error } = await supabase
    .from('reminders')
    .select('id, message, due_at')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .eq('completed', false)
    .order('due_at', { ascending: true });

  if (error) {
    console.error('[Reminders] Failed to list user reminders:', error.message);
    return null;
  }

  return Array.isArray(data) ? data : [];
}

module.exports = {
  parseDuration,
  createReminder,
  getDueReminders,
  claimReminder,
  releaseReminder,
  markReminderComplete,
  getUserReminders,
  TIME_UNITS,
};
