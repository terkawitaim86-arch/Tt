const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getWarnings } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');
const {
  createBaseEmbed,
  usageErrorEmbed,
  logCommandError,
  COLORS,
  LIMITS,
} = require('../../utils/embedUtils');

const command = {
  name: 'warnings',
  description: 'View all warnings for a member.',
  category: 'Moderation',
  usage: 'warnings <@member>',
  aliases: ['warnlist'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return fail('You need the **Moderate Members** permission to use this command.', 'Missing permission');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member whose warnings you want to see.');
    }

    try {
      const warnings = await getWarnings(message.guild.id, member.id);
      const shown = Math.min(warnings.length, LIMITS.fields - 1);

      const embed = createBaseEmbed({
        title: `Warnings — ${member.user.tag}`,
        description:
          warnings.length === 0
            ? `<@${member.id}> has no warnings.`
            : `<@${member.id}> has **${warnings.length}** warning${warnings.length === 1 ? '' : 's'}.`,
        color: warnings.length === 0 ? COLORS.success : COLORS.warning,
        thumbnail: member.user.displayAvatarURL({ size: 128 }),
        fields: warnings.slice(0, shown).map((warning, index) => ({
          name: `Warning ${warnings.length - index}`,
          value: `**Reason:** ${warning.reason || 'No reason provided'}\n**Moderator:** <@${warning.moderator_id}>\n**Date:** <t:${Math.floor(new Date(warning.created_at).getTime() / 1000)}:R>`,
          inline: false,
        })),
        footer:
          warnings.length > shown
            ? `ZMB OFFICIAL • Showing the ${shown} most recent of ${warnings.length} warnings`
            : 'ZMB OFFICIAL • Moderation',
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('warnings', error);
      return fail('I could not retrieve the warnings. Please try again.', 'Lookup failed');
    }
  },
};

module.exports = command;
