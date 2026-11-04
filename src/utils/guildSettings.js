const supabase = require('./db');

const cache = new Map();

const DEFAULTS = {
  welcome_channel_id: null,
  welcome_message: 'Welcome {user} to **{server}**! You are member #{count}.',
  goodbye_channel_id: null,
  goodbye_message: '**{user}** has left **{server}**. We\'ll miss you!',
  auto_role_id: null,
  log_chat_channel_id: null,
  log_server_channel_id: null,
  log_role_channel_id: null,
  log_mod_channel_id: null,
  jail_role_id: null,
  jail_channel_id: null,
  xp_enabled: true,
  xp_cooldown_seconds: 60,
  xp_min: 15,
  xp_max: 25,
  xp_ignored_channels: [],
  xp_boost_channels: [],
  anti_spam_enabled: false,
  anti_spam_threshold: 5,
  anti_spam_interval_seconds: 3,
  anti_spam_action: 'timeout',
  anti_spam_duration_seconds: 600,
};

async function getSettings(guildId) {
  if (cache.has(guildId)) return cache.get(guildId);
  const { data, error } = await supabase.from('guild_settings').select('*').eq('guild_id', guildId).maybeSingle();
  if (error || !data) {
    const merged = { ...DEFAULTS, guild_id: guildId };
    cache.set(guildId, merged);
    return merged;
  }
  const merged = { ...DEFAULTS, ...data };
  cache.set(guildId, merged);
  return merged;
}

async function updateSettings(guildId, updates) {
  const { error } = await supabase.from('guild_settings').upsert({ guild_id: guildId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'guild_id' });
  if (error) {
    console.error('[GuildSettings] Failed to update:', error.message);
    return false;
  }
  cache.delete(guildId);
  return true;
}

function clearCache(guildId) {
  if (guildId) cache.delete(guildId);
  else cache.clear();
}

module.exports = { getSettings, updateSettings, clearCache, DEFAULTS };
