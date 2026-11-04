const supabase = require('./db');

const userMessages = new Map();

function trackMessage(userId) {
  const now = Date.now();
  if (!userMessages.has(userId)) userMessages.set(userId, []);
  const messages = userMessages.get(userId);
  messages.push(now);
  const cutoff = now - 10000;
  const recent = messages.filter((t) => t > cutoff);
  userMessages.set(userId, recent);
  return recent;
}

async function checkAntiSpam(message, settings) {
  if (!settings.anti_spam_enabled) return false;
  if (message.member.permissions.has('ManageMessages')) return false;
  const recent = trackMessage(message.author.id);
  const windowMs = settings.anti_spam_interval_seconds * 1000;
  const now = Date.now();
  const inWindow = recent.filter((t) => t > now - windowMs);
  if (inWindow.length >= settings.anti_spam_threshold) {
    const duration = settings.anti_spam_duration_seconds;
    if (settings.anti_spam_action === 'timeout') {
      try { await message.member.timeout(duration * 1000, 'Anti-spam: too many messages'); } catch (e) { console.error('[AntiSpam] Failed to timeout:', e.message); }
    } else if (settings.anti_spam_action === 'kick') {
      try { await message.member.kick('Anti-spam: too many messages'); } catch (e) { console.error('[AntiSpam] Failed to kick:', e.message); }
    }
    userMessages.set(message.author.id, []);
    await supabase.from('moderation_logs').insert({ guild_id: message.guild.id, action: 'anti_spam', target_id: message.author.id, moderator_id: message.client.user.id, reason: `Anti-spam triggered (${inWindow.length} messages in ${settings.anti_spam_interval_seconds}s)`, duration: settings.anti_spam_action === 'timeout' ? `${duration}s` : null });
    return true;
  }
  return false;
}

function clearUser(userId) { userMessages.delete(userId); }
module.exports = { trackMessage, checkAntiSpam, clearUser };
