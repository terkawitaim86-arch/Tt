
const supabase = require('../../utils/db');

const userMessages = new Map();
const processingUsers = new Set();

function trackMessage(userId, guildId = 'global') {
  const now = Date.now();
  const key = `${guildId}:${userId}`;

  if (!userMessages.has(key)) {
    userMessages.set(key, []);
  }

  const messages = userMessages.get(key);
  messages.push(now);

  const recent = messages.filter(time => time > now - 10000);

  userMessages.set(key, recent);

  return recent;
}

async function checkAntiSpam(message, settings) {
  if (!message.guild || !message.member || !settings) {
    return false;
  }

  if (!settings.anti_spam_enabled) return false;

  if (message.member.permissions.has('ManageMessages')) {
    return false;
  }

  const threshold = Number(settings.anti_spam_threshold);
  const interval = Number(settings.anti_spam_interval_seconds);
  const duration = Number(settings.anti_spam_duration_seconds);

  if (
    !Number.isInteger(threshold) ||
    threshold < 2 ||
    !Number.isFinite(interval) ||
    interval <= 0
  ) {
    console.error('[AntiSpam] Invalid anti-spam settings.');
    return false;
  }

  const userId = message.author.id;
  const guildId = message.guild.id;
  const key = `${guildId}:${userId}`;

  if (processingUsers.has(key)) return false;

  const recent = trackMessage(userId, guildId);
  const now = Date.now();

  const inWindow = recent.filter(
    time => time > now - interval * 1000
  );

  if (inWindow.length < threshold) return false;

  processingUsers.add(key);

  try {
    let actionSucceeded = false;

    if (settings.anti_spam_action === 'timeout') {
      if (
        !Number.isInteger(duration) ||
        duration < 1 ||
        duration > 40320
      ) {
        console.error('[AntiSpam] Invalid timeout duration.');
        return false;
      }

      try {
        await message.member.timeout(
          duration * 1000,
          'Anti-spam: too many messages'
        );

        actionSucceeded = true;
      } catch (error) {
        console.error('[AntiSpam] Failed to timeout:', error.message);
      }
    } else if (settings.anti_spam_action === 'kick') {
      try {
        await message.member.kick(
          'Anti-spam: too many messages'
        );

        actionSucceeded = true;
      } catch (error) {
        console.error('[AntiSpam] Failed to kick:', error.message);
      }
    }

    if (!actionSucceeded) return false;

    userMessages.set(key, []);

    const { error } = await supabase
      .from('moderation_logs')
      .insert({
        guild_id: guildId,
        action: 'anti_spam',
        target_id: userId,
        moderator_id: message.client.user.id,
        reason: `Anti-spam triggered (${inWindow.length} messages in ${interval}s)`,
        duration: settings.anti_spam_action === 'timeout'
          ? `${duration}s`
          : null,
      });

    if (error) {
      console.error('[AntiSpam] Failed to log:', error.message);
    }

    return true;
  } catch (error) {
    console.error('[AntiSpam] Unexpected error:', error);
    return false;
  } finally {
    processingUsers.delete(key);
  }
}

function clearUser(userId, guildId = null) {
  if (guildId) {
    userMessages.delete(`${guildId}:${userId}`);
    processingUsers.delete(`${guildId}:${userId}`);
    return;
  }

  for (const key of userMessages.keys()) {
    if (key.endsWith(`:${userId}`)) {
      userMessages.delete(key);
    }
  }

  for (const key of processingUsers) {
    if (key.endsWith(`:${userId}`)) {
      processingUsers.delete(key);
    }
  }
}

module.exports = {
  trackMessage,
  checkAntiSpam,
  clearUser,
};
