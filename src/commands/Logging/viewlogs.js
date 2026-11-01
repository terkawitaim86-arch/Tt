const { PermissionFlagsBits } = require('discord.js');
const supabase = require('../../utils/db');
const { infoEmbed, errorEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'viewlogs',
  description: 'View recent moderation log entries.',
  category: 'Logging',
  usage: 'viewlogs [type] [amount]',
  aliases: ['logs', 'modlogs'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Server** permission to use this command.',
          })
        )
      );
    }

    const type = args[0]?.toLowerCase();
    let amount = Number.parseInt(args[type ? 1 : 0], 10);
    if (!Number.isFinite(amount) || amount < 1) amount = 10;
    if (amount > 25) amount = 25;

    let query = supabase
      .from('moderation_logs')
      .select('action, target_id, moderator_id, reason, duration, created_at')
      .eq('guild_id', message.guild.id)
      .order('created_at', { ascending: false })
      .limit(amount);

    if (type) {
      query = query.eq('action', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[viewlogs] failed:', error.message);
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Logs unavailable',
            description: 'Failed to fetch logs. Please try again.',
          })
        )
      );
    }

    if (!data || data.length === 0) {
      return message.reply(
        replyOptions(
          infoEmbed({
            title: 'Moderation Logs',
            description: type ? `No \`${type}\` entries found.` : 'No log entries found.',
            footer: 'ZMB • Moderation Logs',
          })
        )
      );
    }

    const shown = data.slice(0, 10);
    const embed = infoEmbed({
      title: `Moderation Logs${type ? ` — ${type}` : ''}`,
      fields: shown.map((entry) => ({
        name: `${entry.action} — <@${entry.target_id}>`,
        value: [
          `**Mod:** <@${entry.moderator_id}>`,
          `**Reason:** ${(entry.reason || 'None').slice(0, 800)}`,
          entry.duration ? `**Duration:** ${entry.duration}` : null,
          `**Date:** <t:${Math.floor(new Date(entry.created_at).getTime() / 1000)}:R>`,
        ]
          .filter(Boolean)
          .join('\n'),
        inline: false,
      })),
      footer: `Showing ${shown.length} of ${data.length} entries`,
    });

    return message.reply(replyOptions(embed));
  },
};
