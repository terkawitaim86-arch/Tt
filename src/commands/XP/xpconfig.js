const { PermissionFlagsBits } = require('discord.js');
const { getSettings, updateSettings } = require('../../utils/guildSettings');
const { infoEmbed, successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { formatNumber, formatDuration } = require('../../utils/format');

const SUBCOMMANDS = [
  '`xpconfig on/off` — enable or disable XP gain',
  '`xpconfig cooldown <seconds>` — seconds between XP gains (0-3600)',
  '`xpconfig min <number>` — minimum XP per message (1-100)',
  '`xpconfig max <number>` — maximum XP per message (1-100)',
  '`xpconfig ignore <#channel>` — disable XP in a channel',
  '`xpconfig unignore <#channel>` — re-enable XP in a channel',
  '`xpconfig config` — view current settings',
];

function reply(message, embed) {
  return message.reply(replyOptions(embed));
}

module.exports = {
  name: 'xpconfig',
  description: 'Configure XP settings: enable/disable, cooldown, and ignored channels.',
  category: 'XP & Levels',
  usage: 'xpconfig <on|off|config|cooldown|min|max|ignore|unignore> [value]',
  aliases: ['setxp'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return reply(
        message,
        errorEmbed({
          title: 'Missing permission',
          description: 'You need the **Manage Server** permission to use this command.',
        })
      );
    }

    const subcommand = args[0]?.toLowerCase();

    let settings;
    try {
      settings = await getSettings(message.guild.id);
    } catch (error) {
      console.error('[xpconfig] Failed to load settings:', error.message);
      return reply(
        message,
        errorEmbed({
          title: 'Settings unavailable',
          description: 'Could not load the current XP settings. Please try again.',
        })
      );
    }

    const save = async (patch, embed) => {
      const ok = await updateSettings(message.guild.id, patch);
      if (!ok) {
        return reply(
          message,
          errorEmbed({
            title: 'Settings not saved',
            description: 'Failed to save the new XP settings. Please try again.',
          })
        );
      }
      return reply(message, embed);
    };

    if (subcommand === 'on' || subcommand === 'off') {
      const enabled = subcommand === 'on';
      return save({ xp_enabled: enabled }, successEmbed({
        title: 'XP Settings Updated',
        description: `XP gain is now **${enabled ? 'enabled' : 'disabled'}**.`,
        footer: 'ZMB • XP',
      }));
    }

    if (subcommand === 'cooldown') {
      const value = parseInt(args[1], 10);
      if (!Number.isFinite(value) || value < 0 || value > 3600) {
        return reply(
          message,
          usageEmbed({
            command: 'xpconfig cooldown',
            syntax: 'xpconfig cooldown <seconds>',
            example: 'xpconfig cooldown 60',
            description: 'Cooldown must be between 0 and 3600 seconds.',
          })
        );
      }
      return save({ xp_cooldown_seconds: value }, successEmbed({
        title: 'XP Settings Updated',
        fields: [{ name: 'Cooldown', value: value === 0 ? 'None' : formatDuration(value), inline: true }],
        footer: 'ZMB • XP',
      }));
    }

    if (subcommand === 'min' || subcommand === 'max') {
      const value = parseInt(args[1], 10);
      if (!Number.isFinite(value) || value < 1 || value > 100) {
        return reply(
          message,
          usageEmbed({
            command: `xpconfig ${subcommand}`,
            syntax: `xpconfig ${subcommand} <number>`,
            example: `xpconfig ${subcommand} 10`,
            description: 'Value must be between 1 and 100.',
          })
        );
      }
      return save({ [`xp_${subcommand}`]: value }, successEmbed({
        title: 'XP Settings Updated',
        fields: [{ name: subcommand === 'min' ? 'Min XP' : 'Max XP', value: `${value} per message`, inline: true }],
        footer: 'ZMB • XP',
      }));
    }

    if (subcommand === 'ignore' || subcommand === 'unignore') {
      const channel = message.mentions.channels.first();
      if (!channel) {
        return reply(
          message,
          usageEmbed({
            command: `xpconfig ${subcommand}`,
            syntax: `xpconfig ${subcommand} <#channel>`,
            example: `xpconfig ${subcommand} #general`,
          })
        );
      }

      const current = Array.isArray(settings.xp_ignored_channels) ? settings.xp_ignored_channels : [];
      const ignored = subcommand === 'ignore'
        ? [...new Set([...current, channel.id])]
        : current.filter((id) => id !== channel.id);

      return save({ xp_ignored_channels: ignored }, successEmbed({
        title: 'XP Settings Updated',
        description: subcommand === 'ignore'
          ? `XP is now disabled in <#${channel.id}>.`
          : `XP is now enabled in <#${channel.id}>.`,
        footer: 'ZMB • XP',
      }));
    }

    if (subcommand === 'config' || !subcommand) {
      const ignored = Array.isArray(settings.xp_ignored_channels) ? settings.xp_ignored_channels : [];
      const min = settings.xp_min ?? 15;
      const max = settings.xp_max ?? 25;

      return reply(
        message,
        infoEmbed({
          title: 'XP Configuration',
          fields: [
            { name: 'Status', value: settings.xp_enabled ? 'Enabled' : 'Disabled', inline: true },
            { name: 'Cooldown', value: settings.xp_cooldown_seconds ? formatDuration(settings.xp_cooldown_seconds) : 'None', inline: true },
            { name: 'XP per Message', value: max === min ? `${formatNumber(min)} XP` : `${formatNumber(min)}-${formatNumber(max)} XP`, inline: true },
            { name: 'Ignored Channels', value: ignored.length ? ignored.slice(0, 15).map((id) => `<#${id}>`).join(', ') : 'None', inline: false },
          ],
          footer: 'Use ,xpconfig config to review these settings',
        })
      );
    }

    return reply(
      message,
      usageEmbed({
        command: 'xpconfig',
        syntax: 'xpconfig <option> [value]',
        example: 'xpconfig cooldown 60',
        description: SUBCOMMANDS.join('\n'),
      })
    );
  },
};
