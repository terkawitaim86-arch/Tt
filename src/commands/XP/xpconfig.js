const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');
const { getPrefix } = require('../../utils/prefixManager');
const {
  infoEmbed,
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  createBaseEmbed,
  codeBlock,
  COLORS,
} = require('../../utils/embedUtils');

const command = {
  name: 'xpconfig',
  description: 'Configure XP settings: enable/disable, cooldown, and ignored channels.',
  category: 'XP & Levels',
  usage: 'xpconfig <on|off|cooldown|min|max|ignore|unignore|config> [value]',
  aliases: ['setxp'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });
    const saved = (description) =>
      message.reply({ embeds: [successEmbed({ title: 'XP settings updated', description, footerContext: 'Levels' })] });
    const saveFailed = () =>
      message.reply({
        embeds: [
          createBaseEmbed({
            title: 'XP settings not saved',
            description: 'The XP settings could not be saved. Please try again.',
            color: COLORS.error,
            footerContext: 'Levels',
          }),
        ],
      });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const subcommand = args[0]?.toLowerCase();

    try {
      const settings = await getSettings(message.guild.id);

      if (subcommand === 'on' || subcommand === 'off') {
        const enabled = subcommand === 'on';
        const ok = await updateSettings(message.guild.id, { xp_enabled: enabled });
        if (!ok) return saveFailed();
        return saved(`The XP system is now **${enabled ? 'enabled' : 'disabled'}**.`);
      }

      if (subcommand === 'cooldown') {
        const value = Number.parseInt(args[1], 10);
        if (!Number.isFinite(value) || value < 0 || value > 3600) {
          return fail('Cooldown must be a whole number between 0 and 3600 seconds.', 'Invalid cooldown');
        }
        const ok = await updateSettings(message.guild.id, { xp_cooldown_seconds: value });
        if (!ok) return saveFailed();
        return saved(`XP cooldown set to **${value} seconds**.`);
      }

      if (subcommand === 'min' || subcommand === 'max') {
        const value = Number.parseInt(args[1], 10);
        if (!Number.isFinite(value) || value < 1 || value > 100) {
          return fail(`The ${subcommand === 'min' ? 'minimum' : 'maximum'} XP value must be a whole number between 1 and 100.`, 'Invalid XP amount');
        }
        const column = subcommand === 'min' ? 'xp_min' : 'xp_max';
        const ok = await updateSettings(message.guild.id, { [column]: value });
        if (!ok) return saveFailed();
        return saved(`${subcommand === 'min' ? 'Minimum' : 'Maximum'} XP per message set to **${value}**.`);
      }

      if (subcommand === 'ignore' || subcommand === 'unignore') {
        const channel = message.mentions.channels.first();
        if (!channel) {
          return fail('Mention the channel to change.', 'No channel mentioned');
        }
        const current = settings.xp_ignored_channels || [];
        const ignored =
          subcommand === 'ignore'
            ? [...new Set([...current, channel.id])]
            : current.filter((id) => id !== channel.id);
        const ok = await updateSettings(message.guild.id, { xp_ignored_channels: ignored });
        if (!ok) return saveFailed();
        return saved(
          subcommand === 'ignore'
            ? `XP is now disabled in <#${channel.id}>.`
            : `XP is now enabled in <#${channel.id}>.`
        );
      }

      if (subcommand === 'config' || !subcommand) {
        const ignored = settings.xp_ignored_channels || [];
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'XP configuration',
              description: `Change a setting with \`${prefix}xpconfig <option> [value]\`.`,
              fields: [
                { name: 'Status', value: settings.xp_enabled ? 'Enabled' : 'Disabled', inline: true },
                { name: 'Cooldown', value: `${settings.xp_cooldown_seconds}s`, inline: true },
                { name: 'XP per message', value: `${settings.xp_min}–${settings.xp_max}`, inline: true },
                {
                  name: 'Ignored channels',
                  value: ignored.length ? ignored.map((id) => `<#${id}>`).join(', ') : 'None',
                  inline: false,
                },
              ],
              footerContext: 'Levels',
            }),
          ],
        });
      }

      return fail(
        `Unknown option **${subcommand}**. Use one of: ${['on', 'off', 'cooldown', 'min', 'max', 'ignore', 'unignore', 'config'].map((option) => `\`${option}\``).join(', ')}.`,
        'Unknown option'
      );
    } catch (error) {
      logCommandError('xpconfig', error);
      return saveFailed();
    }
  },
};

module.exports = command;
