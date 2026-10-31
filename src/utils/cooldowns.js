const cooldowns = new Map();

function checkCooldown(key, seconds) {
  const now = Date.now();
  const expireAt = now + seconds * 1000;

  if (cooldowns.has(key)) {
    const existing = cooldowns.get(key);
    if (existing > now) {
      return { onCooldown: true, remaining: Math.ceil((existing - now) / 1000) };
    }
  }

  cooldowns.set(key, expireAt);
  return { onCooldown: false };
}

module.exports = { checkCooldown };
