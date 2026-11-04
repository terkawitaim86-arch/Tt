const supabase = require('./db');

async function saveTemplate(guildId, name, data) {
  const { error } = await supabase.from('embed_templates').upsert({ guild_id: guildId, name: name.toLowerCase(), data }, { onConflict: 'guild_id,name' });
  if (error) { console.error('[EmbedTemplates] Failed to save:', error.message); return false; }
  return true;
}
async function getTemplate(guildId, name) {
  const { data, error } = await supabase.from('embed_templates').select('data').eq('guild_id', guildId).eq('name', name.toLowerCase()).maybeSingle();
  if (error || !data) return null;
  return data.data;
}
async function listTemplates(guildId) {
  const { data, error } = await supabase.from('embed_templates').select('name').eq('guild_id', guildId).order('name', { ascending: true });
  if (error || !data) return [];
  return data.map((t) => t.name);
}
async function deleteTemplate(guildId, name) {
  const { data, error } = await supabase.from('embed_templates').delete().eq('guild_id', guildId).eq('name', name.toLowerCase()).select('id').maybeSingle();
  if (error) { console.error('[EmbedTemplates] Failed to delete:', error.message); return false; }
  return !!data;
}
module.exports = { saveTemplate, getTemplate, listTemplates, deleteTemplate };
