const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getWarnings } = require('../../utils/modLog');

module.exports = {
  name: 'warnings',
  description: 'View all warnings for a member.',
  category: 'Moderation',
  usage: 'warnings <@member>',
  aliases: ['warnlist'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You need the **Moderate Members** permission to use this command.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Usage: `warnings <@member>`');
    }

    try {
      const warnings = await getWarnings(message.guild.id, member.id);

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`⚠️ Warnings for ${member.user.tag}`)
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      if (warnings.length === 0) {
        embed.setDescription(`<@${member.id}> has no warnings.`);
      } else {
        embed.setDescription(`**Total warnings: ${warnings.length}**\n`);

        const fields = warnings.map((w, i) => ({
          name: `Warning #${warnings.length - i}`,
          value: `**Reason:** ${w.reason || 'No reason provided'}\n**Moderator:** <@${w.moderator_id}>\n**Date:** <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>`,
          inline: false,
        }));

        embed.addFields(fields);
      }

      embed.setFooter({ text: `${config.botName} • Moderation` });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[warnings] Failed:', error);
      return message.reply('Failed to retrieve warnings. Please try again.');
    }
  },
};
