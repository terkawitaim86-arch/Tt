const { PermissionFlagsBits } = require('discord.js');
const { infoEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration } = require('../../utils/permissions');
const { truncate, formatNumber } = require('../../utils/format');
const { getWarnings } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'warnings',
  description: 'View all warnings for a member.',
  category: 'Moderation',
  usage: 'warnings <@member>',
  aliases: ['warnlist'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const member = message.mentions.members.first();

    if (!member) {
      return message.reply(replyOptions(usageEmbed({
        command: 'warnings',
        syntax: `${prefix}warnings <@member>`,
        example: `${prefix}warnings @Member`,
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ModerateMembers,
      permissionLabel: 'Moderate Members',
      command: 'warnings',
    });
    if (denied) return message.reply(replyOptions(denied));

    let warnings;
    try {
      warnings = await getWarnings(message.guild.id, member.id);
    } catch (error) {
      console.error(`[warnings] Failed to load for ${member.id}:`, error.message);
      warnings = null;
    }

    if (!warnings) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Could not load warnings',
        description: 'The warning history could not be read from the database. Please try again.',
        footer: 'ZMB • warnings',
      })));
    }

    if (warnings.length === 0) {
      return message.reply(replyOptions(infoEmbed({
        title: 'No warnings',
        description: `<@${member.id}> has no warnings on record.`,
        footer: 'ZMB • warnings',
      })));
    }

    const lines = warnings.slice(0, 10).map((warning, index) => {
      const stamp = warning.created_at ? Math.floor(new Date(warning.created_at).getTime() / 1000) : null;
      const when = stamp && Number.isFinite(stamp) ? `<t:${stamp}:d>` : 'unknown date';
      return `**#${warnings.length - index}** • ${when} • <@${warning.moderator_id}>\n${truncate(warning.reason || 'No reason provided', 200)}`;
    });

    if (warnings.length > 10) {
      lines.push(`…and ${formatNumber(warnings.length - 10)} more.`);
    }

    return message.reply(replyOptions(infoEmbed({
      title: `Warnings for ${member.user.tag}`,
      description: lines.join('\n\n'),
      footer: `ZMB • warnings • Total: ${formatNumber(warnings.length)}`,
    })));
  },
};
