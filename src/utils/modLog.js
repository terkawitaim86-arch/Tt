const supabase = require('./db');

async function logAction({ guildId, action, targetId, moderatorId, reason, duration }) {
  const { error } = await supabase
    .from('moderation_logs')
    .insert({
      guild_id: guildId,
      action,
      target_id: targetId,
      moderator_id: moderatorId,
      reason: reason || null,
      duration: duration || null,
    });

  if (error) {
    console.error('[ModLog] Failed to log action:', error.message);
  }
}

async function addWarning({ guildId, userId, moderatorId, reason }) {
  const { data, error } = await supabase
    .from('moderation_warnings')
    .insert({
      guild_id: guildId,
      user_id: userId,
      moderator_id: moderatorId,
      reason: reason || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ModLog] Failed to add warning:', error.message);
    return null;
  }

  return data.id;
}

async function getWarnings(guildId, userId) {
  const { data, error } = await supabase
    .from('moderation_warnings')
    .select('id, reason, moderator_id, created_at')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ModLog] Failed to fetch warnings:', error.message);
    return [];
  }

  return data || [];
}

module.exports = { logAction, addWarning, getWarnings };
