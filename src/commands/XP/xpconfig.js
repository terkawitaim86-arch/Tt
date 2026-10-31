const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'xpconfig',
  description: 'Configure XP settings: enable/disable, cooldown, and ignored channels.',
  category: 'XP & Levels',
  usage: 'xpconfig <on|off|config|cooldown|min|max|ignore|unignore> [value]',
  aliases: ['setxp'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const subcommand = args[0]?.toLowerCase();
    const settings = await getSettings(message.guild.id);

    if (subcommand === 'on') {
      await updateSettings(message.guild.id, { xp_enabled: true });
      return message.reply('XP system is now **enabled**.');
    }

    if (subcommand === 'off') {
      await updateSettings(message.guild.id, { xp_enabled: false });
      return message.reply('XP system is now **disabled**.');
    }

    if (subcommand === 'cooldown') {
      const value = parseInt(args[1], 10);
      if (!value || value < 0 || value > 3600) {
        return message.reply('Cooldown must be between 0 and 3600 seconds. Usage: `xpconfig cooldown <seconds>`');
      }
      await updateSettings(message.guild.id, { xp_cooldown_seconds: value });
      return message.reply(`XP cooldown set to **${value} seconds**.`);
    }

    if (subcommand === 'min') {
      const value = parseInt(args[1], 10);
      if (!value || value < 1 || value > 100) {
        return message.reply('Min XP must be between 1 and 100. Usage: `xpconfig min <number>`');
      }
      await updateSettings(message.guild.id, { xp_min: value });
      return message.reply(`Min XP per message set to **${value}**.`);
    }

    if (subcommand === 'max') {
      const value = parseInt(args[1], 10);
      if (!value || value < 1 || value > 100) {
        return message.reply('Max XP must be between 1 and 100. Usage: `xpconfig max <number>`');
      }
      await updateSettings(message.guild.id, { xp_max: value });
      return message.reply(`Max XP per message set to **${value}**.`);
    }

    if (subcommand === 'ignore') {
      const channel = message.mentions.channels.first();
      if (!channel) {
        return message.reply('Usage: `xpconfig ignore <#channel>`');
      }
      const ignored = [...(settings.xp_ignored_channels || []), channel.id];
      await updateSettings(message.guild.id, { xp_ignored_channels: ignored });
      return message.reply(`XP is now disabled in <#${channel.id}>.`);
    }

    if (subcommand === 'unignore') {
      const channel = message.mentions.channels.first();
      if (!channel) {
        return message.reply('Usage: `xpconfig unignore <#channel>`');
      }
      const ignored = (settings.xp_ignored_channels || []).filter((id) => id !== channel.id);
      await updateSettings(message.guild.id, { xp_ignored_channels: ignored });
      return message.reply(`XP is now enabled in <#${channel.id}>.`);
    }

    if (subcommand === 'config' || !subcommand) {
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('XP Configuration')
        .addFields(
          { name: 'Status', value: settings.xp_enabled ? 'Enabled' : 'Disabled', inline: true },
          { name: 'Cooldown', value: `${settings.xp_cooldown_seconds}s`, inline: true },
          { name: 'XP Range', value: `${settings.xp_min}-${settings.xp_max}`, inline: true },
          { name: 'Ignored Channels', value: (settings.xp_ignored_channels || []).length > 0 ? (settings.xp_ignored_channels || []).map((id) => `<#${id}>`).join(', ') : 'None', inline: false }
        )
        .setFooter({ text: 'Use ,xpconfig <on|off|cooldown|min|max|ignore|unignore> to configure' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply(
      'Usage:\n' +
      '`xpconfig on/off` — enable/disable XP\n' +
      '`xpconfig cooldown <seconds>` — set XP cooldown\n' +
      '`xpconfig min <number>` — set min XP per message\n' +
      '`xpconfig max <number>` — set max XP per message\n' +
      '`xpconfig ignore <#channel>` — disable XP in a channel\n' +
      '`xpconfig unignore <#channel>` — re-enable XP in a channel\n' +
      '`xpconfig config` — view current settings'
    );
  },
};
