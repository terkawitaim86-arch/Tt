const supabase = require('./db');

const TIME_UNITS = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
function parseDuration(input) {
  const match = /^(\d+)([smhdw])$/.exec(input.toLowerCase());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return { seconds: value * TIME_UNITS[unit], display: `${value}${unit}` };
}
async function createReminder({ guildId, channelId, userId, message, dueAt }) {
  const { data, error } = await supabase.from('reminders').insert({ guild_id: guildId, channel_id: channelId, user_id: userId, message, due_at: dueAt.toISOString() }).select('id').single();
  if (error) { console.error('[Reminders] Failed to create:', error.message); return null; }
  return data.id;
}
async function getDueReminders() {
  const { data, error } = await supabase.from('reminders').select('id, channel_id, user_id, message, due_at').eq('completed', false).lte('due_at', new Date().toISOString()).limit(10);
  if (error || !data) return [];
  return data;
}
async function markReminderComplete(id) {
  const { error } = await supabase.from('reminders').update({ completed: true }).eq('id', id);
  if (error) console.error('[Reminders] Failed to mark complete:', error.message);
}
async function getUserReminders(guildId, userId) {
  const { data, error } = await supabase.from('reminders').select('id, message, due_at').eq('guild_id', guildId).eq('user_id', userId).eq('completed', false).order('due_at', { ascending: true });
  if (error || !data) return [];
  return data;
}
module.exports = { parseDuration, createReminder, getDueReminders, markReminderComplete, getUserReminders, TIME_UNITS };
