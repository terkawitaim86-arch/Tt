const supabase = require('./db');

async function getReactionRoles(messageId) {
  const { data, error } = await supabase
    .from('reaction_roles')
    .select('emoji, role_id')
    .eq('message_id', messageId);

  if (error || !data) return [];
  return data;
}

async function addReactionRole({ guildId, channelId, messageId, emoji, roleId }) {
  const { error } = await supabase
    .from('reaction_roles')
    .insert({ guild_id: guildId, channel_id: channelId, message_id: messageId, emoji, role_id: roleId });

  if (error) {
    console.error('[ReactionRoles] Failed to add:', error.message);
    return false;
  }

  return true;
}

async function removeReactionRolesByMessage(messageId) {
  const { error } = await supabase
    .from('reaction_roles')
    .delete()
    .eq('message_id', messageId);

  if (error) {
    console.error('[ReactionRoles] Failed to remove:', error.message);
    return false;
  }

  return true;
}

async function getButtonRoles(messageId) {
  const { data, error } = await supabase
    .from('button_roles')
    .select('label, style, role_id')
    .eq('message_id', messageId);

  if (error || !data) return [];
  return data;
}

async function addButtonRole({ guildId, channelId, messageId, label, style, roleId }) {
  const { error } = await supabase
    .from('button_roles')
    .insert({ guild_id: guildId, channel_id: channelId, message_id: messageId, label, style, role_id: roleId });

  if (error) {
    console.error('[ButtonRoles] Failed to add:', error.message);
    return false;
  }

  return true;
}

module.exports = { getReactionRoles, addReactionRole, removeReactionRolesByMessage, getButtonRoles, addButtonRole };
