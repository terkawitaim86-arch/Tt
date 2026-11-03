
onst supabase = require('./db');

async function setAfk(guildId, userId, reason) {
  const { error } = await supabase
    .from('afk_status')
    .upsert({
      guild_id: guildId,
      user_id: userId,
      reason: reason || 'AFK',
    }, { onConflict: 'guild_id,user_id' });

  if (error) {
    console.error('[AFK] Failed to set:', error.message);
    return false;
  }

  return true;
}

async function removeAfk(guildId, userId) {
  const { error } = await supabase
    .from('afk_status')
    .delete()
    .eq('guild_id', guildId)
    .eq('user_id', userId);

  if (error) {
    console.error('[AFK] Failed to remove:', error.message);
    return false;
  }

  return true;
}

async function getAfk(guildId, userId) {
  const { data, error } = await supabase
    .from('afk_status')
    .select('reason, created_at')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function checkAllAfk(guildId, userIds) {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('afk_status')
    .select('user_id, reason, created_at')
    .eq('guild_id', guildId)
    .in('user_id', userIds);

  if (error || !data) return new Map();

  const map = new Map();
  for (const row of data) {
    map.set(row.user_id, row);
  }
  return map;
}

module.exports = { setAfk, removeAfk, getAfk, checkAllAfk };
