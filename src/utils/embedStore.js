
const supabase = require('./db');

function isValidInput(guildId, name) {
  return (
    typeof guildId === 'string' &&
    /^\d{17,20}$/.test(guildId) &&
    typeof name === 'string' &&
    /^[a-z0-9_-]{1,32}$/i.test(name)
  );
}

async function saveTemplate(guildId, name, data) {
  if (!isValidInput(guildId, name) || !data || typeof data !== 'object') {
    return false;
  }

  try {
    const { error } = await supabase
      .from('embed_templates')
      .upsert(
        {
          guild_id: guildId,
          name: name.toLowerCase(),
          data,
        },
        { onConflict: 'guild_id,name' }
      );

    if (error) {
      console.error('[EmbedTemplates] Failed to save:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[EmbedTemplates] Save error:', error.message);
    return false;
  }
}

async function getTemplate(guildId, name) {
  if (!isValidInput(guildId, name)) return null;

  try {
    const { data, error } = await supabase
      .from('embed_templates')
      .select('data')
      .eq('guild_id', guildId)
      .eq('name', name.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('[EmbedTemplates] Failed to load:', error.message);
      return null;
    }

    return data?.data ?? null;
  } catch (error) {
    console.error('[EmbedTemplates] Load error:', error.message);
    return null;
  }
}

async function listTemplates(guildId) {
  if (typeof guildId !== 'string' || !/^\d{17,20}$/.test(guildId)) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('embed_templates')
      .select('name')
      .eq('guild_id', guildId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[EmbedTemplates] Failed to list:', error.message);
      return [];
    }

    return (data || [])
      .map((template) => template.name)
      .filter((name) => typeof name === 'string');
  } catch (error) {
    console.error('[EmbedTemplates] List error:', error.message);
    return [];
  }
}

async function deleteTemplate(guildId, name) {
  if (!isValidInput(guildId, name)) return false;

  try {
    const { data, error } = await supabase
      .from('embed_templates')
      .delete()
      .eq('guild_id', guildId)
      .eq('name', name.toLowerCase())
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[EmbedTemplates] Failed to delete:', error.message);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[EmbedTemplates] Delete error:', error.message);
    return false;
  }
}

module.exports = {
  saveTemplate,
  getTemplate,
  listTemplates,
  deleteTemplate,
};
