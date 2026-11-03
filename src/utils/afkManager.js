
const supabase = require('./db');

async function setAfk(guildId, userId, reason) {
  if (!guildId || !userId) return false;

  try {
    const { error } = await supabase
      .from('afk_status')
      .upsert({
        guild_id: guildId,
        user_id: userId,
        reason: (reason || 'AFK').slice(0, 200),
      }, {
        onConflict: 'guild_id,user_id',
      });

    if (error) {
      console.error('[AFK] Failed to set:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AFK] Database error while setting:', error);
    return false;
  }
}

async function removeAfk(guildId, userId) {
  if (!guildId || !userId) return false;

  try {
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
  } catch (error) {
    console.error('[AFK] Database error while removing:', error);
    return false;
  }
}

async function getAfk(guildId, userId) {
  if (!guildId || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('afk_status')
      .select('reason, created_at')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[AFK] Failed to retrieve:', error.message);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('[AFK] Database error while retrieving:', error);
    return null;
  }
}

async function checkAllAfk(guildId, userIds) {
  if (!guildId || !Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }

  try {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];

    if (uniqueIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('afk_status')
      .select('user_id, reason, created_at')
      .eq('guild_id', guildId)
      .in('user_id', uniqueIds);

    if (error) {
      console.error('[AFK] Failed to check users:', error.message);
      return new Map();
    }

    return new Map(
      (data || []).map(row => [row.user_id, row])
    );
  } catch (error) {
    console.error('[AFK] Database error while checking users:', error);
    return new Map();
  }
}

module.exports = {
  setAfk,
  removeAfk,
  getAfk,
  checkAllAfk,
};
