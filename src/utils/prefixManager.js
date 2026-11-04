const supabase = require('./db');
const config = require('../config');

const prefixCache = new Map();

async function getPrefix(guildId) {
  if (prefixCache.has(guildId)) return prefixCache.get(guildId);
  const { data, error } = await supabase.from('guild_prefixes').select('prefix').eq('guild_id', guildId).maybeSingle();
  if (error || !data) {
    prefixCache.set(guildId, config.defaultPrefix);
    return config.defaultPrefix;
  }
  prefixCache.set(guildId, data.prefix);
  return data.prefix;
}

async function setPrefix(guildId, prefix) {
  const { error } = await supabase.from('guild_prefixes').upsert({ guild_id: guildId, prefix }, { onConflict: 'guild_id' });
  if (error) {
    console.error('[PrefixManager] Failed to save prefix:', error.message);
    return false;
  }
  prefixCache.set(guildId, prefix);
  return true;
}

module.exports = { getPrefix, setPrefix };
