const supabase = require('./db');

function xpForLevel(level) {
  return 5 * (level * level) + 50 * level + 100;
}

function levelForXp(totalXp) {
  let level = 0;
  let needed = xpForLevel(0);
  while (totalXp >= needed) {
    totalXp -= needed;
    level++;
    needed = xpForLevel(level);
  }
  return { level, currentXp: totalXp, neededXp: needed };
}

async function getXpData(guildId, userId) {
  const { data, error } = await supabase
    .from('xp_data')
    .select('xp, level, last_xp_at')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Atomically add XP for a member.
 *
 * The addition happens inside the public.add_xp() database function
 * (see supabase/migrations/*_atomic_xp_update.sql). Never read-then-write here:
 * that pattern loses increments when two messages are handled concurrently.
 */
async function addXp(guildId, userId, amount) {
  const delta = Number.isFinite(amount) ? Math.trunc(amount) : 0;

  const { data, error } = await supabase.rpc('add_xp', {
    p_guild_id: guildId,
    p_user_id: userId,
    p_amount: delta,
  });

  if (error) {
    console.error('[XP] Failed to add XP:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.xp !== 'number') {
    console.error('[XP] add_xp returned no row; check that the atomic XP migration has been applied.');
    return null;
  }

  const previousLevel = levelForXp(Math.max(row.xp - delta, 0)).level;
  const { currentXp, neededXp } = levelForXp(row.xp);

  return {
    xp: row.xp,
    level: row.level,
    leveledUp: row.level > previousLevel,
    currentXp,
    neededXp,
  };
}

async function setXp(guildId, userId, amount) {
  const { level } = levelForXp(Math.max(0, amount));

  const { error } = await supabase
    .from('xp_data')
    .upsert({
      guild_id: guildId,
      user_id: userId,
      xp: Math.max(0, amount),
      level,
      last_xp_at: new Date().toISOString(),
    }, { onConflict: 'guild_id,user_id' });

  if (error) {
    console.error('[XP] Failed to set XP:', error.message);
    return false;
  }

  return true;
}

async function getLeaderboard(guildId, limit = 10) {
  const { data, error } = await supabase
    .from('xp_data')
    .select('user_id, xp, level')
    .eq('guild_id', guildId)
    .order('xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[XP] Failed to get leaderboard:', error.message);
    return [];
  }

  return data || [];
}

async function getRank(guildId, userId) {
  const { data, error } = await supabase
    .from('xp_data')
    .select('user_id, xp, level')
    .eq('guild_id', guildId)
    .order('xp', { ascending: false })
    .limit(1000);

  if (error || !data) return { rank: null, total: 0 };

  const index = data.findIndex((row) => row.user_id === userId);
  return { rank: index >= 0 ? index + 1 : null, total: data.length };
}

async function checkLevelReward(guildId, level, client) {
  const { data, error } = await supabase
    .from('level_rewards')
    .select('role_id')
    .eq('guild_id', guildId)
    .eq('level', level)
    .maybeSingle();

  if (error || !data) return null;
  return data.role_id;
}

module.exports = { xpForLevel, levelForXp, getXpData, addXp, setXp, getLeaderboard, getRank, checkLevelReward };
