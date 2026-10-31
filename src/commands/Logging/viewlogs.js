const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const supabase = require('../../utils/db');

module.exports = {
  name: 'viewlogs',
  description: 'View recent moderation log entries.',
  category: 'Logging',
  usage: 'viewlogs [type] [amount]',
  aliases: ['logs', 'modlogs'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const type = args[0]?.toLowerCase();
    let amount = parseInt(args[type ? 1 : 0], 10);
    if (isNaN(amount) || amount < 1) amount = 10;
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
      console.error('[viewlogs] Failed:', error.message);
      return message.reply('Failed to fetch logs. Please try again.');
    }

    if (!data || data.length === 0) {
      return message.reply('No log entries found.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`Moderation Logs${type ? ` — ${type}` : ''}`)
      .setTimestamp();

    const fields = data.slice(0, 10).map((entry) => ({
      name: `${entry.action} — <@${entry.target_id}>`,
      value: `**Mod:** <@${entry.moderator_id}>\n**Reason:** ${entry.reason || 'None'}${entry.duration ? `\n**Duration:** ${entry.duration}` : ''}\n**Date:** <t:${Math.floor(new Date(entry.created_at).getTime() / 1000)}:R>`,
      inline: false,
    }));

    embed.addFields(fields);
    embed.setFooter({ text: `Showing ${data.length} of ${data.length} entries` });

    return message.reply({ embeds: [embed] });
  },
};
