const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'antispam',
  description: 'Configure anti-spam protection for the server.',
  category: 'Security',
  usage: 'antispam <on|off|config|threshold|action|duration> [value]',
  aliases: ['spamconfig'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const subcommand = args[0]?.toLowerCase();
    const settings = await getSettings(message.guild.id);

    if (subcommand === 'on') {
      await updateSettings(message.guild.id, { anti_spam_enabled: true });
      return message.reply('Anti-spam protection is now **enabled**.');
    }

    if (subcommand === 'off') {
      await updateSettings(message.guild.id, { anti_spam_enabled: false });
      return message.reply('Anti-spam protection is now **disabled**.');
    }

    if (subcommand === 'threshold') {
      const value = parseInt(args[1], 10);
      if (!value || value < 2 || value > 50) {
        return message.reply('Threshold must be between 2 and 50. Usage: `antispam threshold <number>`');
      }
      await updateSettings(message.guild.id, { anti_spam_threshold: value });
      return message.reply(`Anti-spam threshold set to **${value} messages**.`);
    }

    if (subcommand === 'action') {
      const action = args[1]?.toLowerCase();
      if (!['timeout', 'kick'].includes(action)) {
        return message.reply('Action must be **timeout** or **kick**. Usage: `antispam action <timeout|kick>`');
      }
      await updateSettings(message.guild.id, { anti_spam_action: action });
      return message.reply(`Anti-spam action set to **${action}**.`);
    }

    if (subcommand === 'duration') {
      const value = parseInt(args[1], 10);
      if (!value || value < 1 || value > 86400) {
        return message.reply('Duration must be between 1 and 86400 seconds. Usage: `antispam duration <seconds>`');
      }
      await updateSettings(message.guild.id, { anti_spam_duration_seconds: value });
      return message.reply(`Anti-spam timeout duration set to **${value} seconds**.`);
    }

    if (subcommand === 'config' || !subcommand) {
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('Anti-Spam Configuration')
        .addFields(
          { name: 'Status', value: settings.anti_spam_enabled ? 'Enabled' : 'Disabled', inline: true },
          { name: 'Threshold', value: `${settings.anti_spam_threshold} messages`, inline: true },
          { name: 'Interval', value: `${settings.anti_spam_interval_seconds}s`, inline: true },
          { name: 'Action', value: settings.anti_spam_action, inline: true },
          { name: 'Duration', value: settings.anti_spam_action === 'timeout' ? `${settings.anti_spam_duration_seconds}s` : 'N/A', inline: true }
        )
        .setFooter({ text: 'Use ,antispam <on|off|threshold|action|duration> <value> to configure' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply(
      'Usage:\n' +
      '`antispam on` — enable anti-spam\n' +
      '`antispam off` — disable anti-spam\n' +
      '`antispam threshold <number>` — set message threshold (default: 5)\n' +
      '`antispam action <timeout|kick>` — set the punishment\n' +
      '`antispam duration <seconds>` — set timeout duration\n' +
      '`antispam config` — view current settings'
    );
  },
};
