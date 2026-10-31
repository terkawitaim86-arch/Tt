const supabase = require('./db');

async function getCustomCommand(guildId, name) {
  const { data, error } = await supabase
    .from('custom_commands')
    .select('response')
    .eq('guild_id', guildId)
    .eq('command_name', name)
    .maybeSingle();

  if (error || !data) return null;
  return data.response;
}

async function getAllCustomCommands(guildId) {
  const { data, error } = await supabase
    .from('custom_commands')
    .select('command_name, response, created_by, created_at')
    .eq('guild_id', guildId)
    .order('command_name', { ascending: true });

  if (error || !data) return [];
  return data;
}

async function createCustomCommand(guildId, name, response, createdBy) {
  const { error } = await supabase
    .from('custom_commands')
    .upsert({
      guild_id: guildId,
      command_name: name.toLowerCase(),
      response,
      created_by: createdBy,
    }, { onConflict: 'guild_id,command_name' });

  if (error) {
    console.error('[CustomCommands] Failed to create:', error.message);
    return false;
  }

  return true;
}

async function deleteCustomCommand(guildId, name) {
  const { data, error } = await supabase
    .from('custom_commands')
    .delete()
    .eq('guild_id', guildId)
    .eq('command_name', name.toLowerCase())
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[CustomCommands] Failed to delete:', error.message);
    return false;
  }

  return !!data;
}

module.exports = { getCustomCommand, getAllCustomCommands, createCustomCommand, deleteCustomCommand };
