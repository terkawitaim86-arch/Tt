const { getPrefix } = require('../utils/prefixManager');
const config = require('../config');
const { getSettings } = require('../utils/guildSettings');
const { addXp, checkLevelReward } = require('../utils/xpManager');
const { getAfk, removeAfk, checkAllAfk } = require('../utils/afkManager');
const { checkAntiSpam } = require('../utils/antiSpam');
const { checkCooldown } = require('../utils/cooldowns');
const { getCustomCommand } = require('../utils/customCommandManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    try {
      const settings = await getSettings(message.guild.id);

      // Anti-spam check (before anything else)
      const isSpam = await checkAntiSpam(message, settings);
      if (isSpam) return;

      // AFK: check if user is returning from AFK
      const userAfk = await getAfk(message.guild.id, message.author.id);
      if (userAfk) {
        await removeAfk(message.guild.id, message.author.id);
        message.reply(`Welcome back <@${message.author.id}>! Your AFK status has been removed.`).catch(() => {});
      }

      // AFK: check if message mentions any AFK users
      const mentionedIds = message.mentions.users.filter((u) => !u.bot).map((u) => u.id);
      if (mentionedIds.length > 0) {
        const afkUsers = await checkAllAfk(message.guild.id, mentionedIds);
        for (const [userId, afkData] of afkUsers) {
          const timeAgo = `<t:${Math.floor(new Date(afkData.created_at).getTime() / 1000)}:R>`;
          message.channel.send(`<@${userId}> is AFK: **${afkData.reason}** (since ${timeAgo})`).catch(() => {});
        }
      }

      // XP: award XP for non-command messages
      if (settings.xp_enabled) {
        const ignoredChannels = settings.xp_ignored_channels || [];
        if (!ignoredChannels.includes(message.channel.id)) {
          const now = Date.now();
          const lastXp = message.author._lastXpAt || 0;
          if (now - lastXp >= settings.xp_cooldown_seconds * 1000) {
            const min = settings.xp_min;
            const max = settings.xp_max;
            const xpAmount = Math.floor(Math.random() * (max - min + 1)) + min;

            const result = await addXp(message.guild.id, message.author.id, xpAmount);
            message.author._lastXpAt = now;

            if (result && result.leveledUp) {
              const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('Level Up!')
                .setDescription(`Congratulations <@${message.author.id}>, you reached **Level ${result.level}**!`)
                .setTimestamp();

              message.channel.send({ embeds: [embed] }).catch(() => {});

              const rewardRoleId = await checkLevelReward(message.guild.id, result.level, client);
              if (rewardRoleId) {
                const role = message.guild.roles.cache.get(rewardRoleId);
                if (role && message.member) {
                  message.member.roles.add(role).catch(() => {});
                }
              }
            }
          }
        }
      }

      // Prefix handling
      let prefix = config.defaultPrefix;
      if (message.guild) {
        prefix = await getPrefix(message.guild.id);
      }

      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      // Try built-in command first
      const command = client.commands.get(commandName);
      if (command) {
        const cdKey = `${message.guild.id}:${message.author.id}:${commandName}`;
        const cd = checkCooldown(cdKey, 3);
        if (cd.onCooldown) {
          return message.reply(`Please wait **${cd.remaining}s** before using that command again.`).catch(() => {});
        }

        try {
          await command.execute(message, args, client);
        } catch (error) {
          console.error(`[Error] Command "${commandName}" failed:`, error);
          message.reply('There was an error running that command.').catch(() => {});
        }
        return;
      }

      // Try custom command
      const customResponse = await getCustomCommand(message.guild.id, commandName);
      if (customResponse) {
        return message.channel.send(customResponse).catch(() => {});
      }
    } catch (error) {
      console.error('[messageCreate] Unhandled error in message handler:', error.message);
      console.error('  Stack:', error.stack);
    }
  },
};
