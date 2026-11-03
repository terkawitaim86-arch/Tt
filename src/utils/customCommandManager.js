
const supabase = require('./db');

const MAX_NAME_LENGTH = 32;
const MAX_RESPONSE_LENGTH = 2000;

function normalizeName(name) {
  if (typeof name !== 'string') return null;

  const normalized = name.trim().toLowerCase();

  if (
    !/^[a-z0-9_-]+$/.test(normalized) ||
    normalized.length > MAX_NAME_LENGTH
  ) {
    return null;
  }

  return normalized;
}

async function getCustomCommand(guildId, name) {
  const commandName = normalizeName(name);

  if (!guildId || !commandName) return null;

  try {
    const { data, error } = await supabase
      .from('custom_commands')
      .select('response')
      .eq('guild_id', guildId)
      .eq('command_name', commandName)
      .maybeSingle();

    if (error) {
      console.error('[CustomCommands] Failed to fetch:', error.message);
      return null;
    }

    return data?.response ?? null;
  } catch (error) {
    console.error('[CustomCommands] Fetch error:', error);
    return null;
  }
}

async function getAllCustomCommands(guildId) {
  if (!guildId) return [];

  try {
    const { data, error } = await supabase
      .from('custom_commands')
      .select('command_name, response, created_by, created_at')
      .eq('guild_id', guildId)
      .order('command_name', { ascending: true });

    if (error) {
      console.error('[CustomCommands] Failed to list:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[CustomCommands] List error:', error);
    return [];
  }
}

async function createCustomCommand(guildId, name, response, createdBy) {
  const commandName = normalizeName(name);

  if (
    !guildId ||
    !commandName ||
    typeof response !== 'string' ||
    !response.trim() ||
    response.length > MAX_RESPONSE_LENGTH ||
    !createdBy
  ) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('custom_commands')
      .upsert(
        {
          guild_id: guildId,
          command_name: commandName,
          response: response.trim(),
          created_by: createdBy,
        },
        { onConflict: 'guild_id,command_name' }
      );

    if (error) {
      console.error('[CustomCommands] Failed to create:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CustomCommands] Create error:', error);
    return false;
  }
}

async function deleteCustomCommand(guildId, name) {
  const commandName = normalizeName(name);

  if (!guildId || !commandName) return false;

  try {
    const { data, error } = await supabase
      .from('custom_commands')
      .delete()
      .eq('guild_id', guildId)
      .eq('command_name', commandName)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[CustomCommands] Failed to delete:', error.message);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[CustomCommands] Delete error:', error);
    return false;
  }
}

module.exports = {
  getCustomCommand,
  getAllCustomCommands,
  createCustomCommand,
  deleteCustomCommand,
};
