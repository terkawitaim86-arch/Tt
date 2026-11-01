const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const supabase = require('../../utils/db');
const { getPrefix } = require('../../utils/prefixManager');
const {
  infoEmbed,
  usageErrorEmbed,
  logCommandError,
  createBaseEmbed,
  sanitizeReason,
  COLORS,
  LIMITS,
} = require('../../utils/embedUtils');

const MAX_SHOWN = Math.min(10, LIMITS.fields);

const command = {
  name: 'viewlogs',
  description: 'View recent moderation log entries.',
  category: 'Logging',
  usage: 'viewlogs [type] [amount]',
  aliases: ['logs', 'modlogs'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const type = args[0]?.toLowerCase();
    let amount = Number.parseInt(args[type ? 1 : 0], 10);
    if (!Number.isFinite(amount) || amount < 1) amount = MAX_SHOWN;
    if (amount > LIMITS.fields) amount = LIMITS.fields;

    try {
      let query = supabase
        .from('moderation_logs')
        .select('action, target_id, moderator_id, reason, duration, created_at')
        .eq('guild_id', message.guild.id)
        .order('created_at', { ascending: false })
        .limit(amount);

      if (type) query = query.eq('action', type);

      const { data, error } = await query;

      if (error) {
        logCommandError('viewlogs', error.message);
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'Logs unavailable',
              description: 'The log history could not be loaded. Please try again.',
              color: COLORS.error,
              footerContext: 'Logging',
            }),
          ],
        });
      }

      if (!data || data.length === 0) {
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'No log entries',
              description: type
                ? `There are no **${type}** entries recorded in this server.`
                : 'There are no moderation entries recorded in this server yet.',
              footerContext: 'Logging',
            }),
          ],
        });
      }

      const shown = data.slice(0, MAX_SHOWN);

      return message.reply({
        embeds: [
          infoEmbed({
            title: type ? `Moderation logs — ${type}` : 'Moderation logs',
            description: `Showing the ${shown.length} most recent entr${shown.length === 1 ? 'y' : 'ies'}.`,
            fields: shown.map((entry) => ({
              name: `${entry.action} · ${entry.target_id?.startsWith?.('0') || /^\d+$/.test(entry.target_id ?? '') ? `<@${entry.target_id}>` : entry.target_id ?? 'Unknown target'}`.slice(0, LIMITS.fieldName),
              value: [
                `**Moderator:** <@${entry.moderator_id}>`,
                `**Reason:** ${sanitizeReason(entry.reason, 'None recorded')}`,
                entry.duration ? `**Duration:** ${entry.duration}` : null,
                `**When:** <t:${Math.floor(new Date(entry.created_at).getTime() / 1000)}:R>`,
              ]
                .filter(Boolean)
                .join('\n')
                .slice(0, LIMITS.fieldValue),
              inline: false,
            })),
            footerContext: 'Logging',
          }),
        ],
      });
    } catch (error) {
      logCommandError('viewlogs', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Logs unavailable',
            description: 'The log history could not be loaded. Please try again.',
            color: COLORS.error,
            footerContext: 'Logging',
          }),
        ],
      });
    }
  },
};

module.exports = command;
