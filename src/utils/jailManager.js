const supabase = require('./db');

async function getJailRecord(guildId, userId) {
  const { data, error } = await supabase.from('jail_records').select('*').eq('guild_id', guildId).eq('user_id', userId).eq('active', true).maybeSingle();
  if (error || !data) return null;
  return data;
}
async function createJailRecord(guildId, userId, previousRoles, jailedBy, reason) {
  const { error } = await supabase.from('jail_records').upsert({ guild_id: guildId, user_id: userId, previous_roles: previousRoles, jailed_by: jailedBy, reason: reason || 'No reason provided', active: true, jailed_at: new Date().toISOString(), released_at: null }, { onConflict: 'guild_id,user_id' });
  if (error) { console.error('[Jail] Failed to create record:', error.message); return false; }
  return true;
}
async function releaseJailRecord(guildId, userId) {
  const { data, error } = await supabase.from('jail_records').update({ active: false, released_at: new Date().toISOString() }).eq('guild_id', guildId).eq('user_id', userId).eq('active', true).select('previous_roles').maybeSingle();
  if (error) { console.error('[Jail] Failed to release record:', error.message); return null; }
  return data;
}
module.exports = { getJailRecord, createJailRecord, releaseJailRecord };
