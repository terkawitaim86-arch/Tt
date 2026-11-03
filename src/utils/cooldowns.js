
const cooldowns = new Map();

function checkCooldown(key, seconds) {
  if (typeof key !== 'string' || !key.trim()) {
    throw new TypeError('[Cooldown] A valid cooldown key is required.');
  }

  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new TypeError('[Cooldown] Cooldown duration must be positive.');
  }

  const now = Date.now();
  const existing = cooldowns.get(key);

  if (existing && existing > now) {
    return {
      onCooldown: true,
      remaining: Math.ceil((existing - now) / 1000),
    };
  }

  cooldowns.set(key, now + seconds * 1000);

  // Remove expired entries periodically when this function is used.
  if (cooldowns.size > 1000) {
    for (const [cooldownKey, expiry] of cooldowns) {
      if (expiry <= now) {
        cooldowns.delete(cooldownKey);
      }
    }
  }

  return {
    onCooldown: false,
    remaining: 0,
  };
}

module.exports = { checkCooldown };
