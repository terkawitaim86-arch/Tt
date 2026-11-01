const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { checkHierarchy } = require('../../utils/modChecks');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server.',
  category: 'Moderation',
  usage: 'ban <@member> [reason]',
  aliases: ['b'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('You need the **Ban Members** permission to use this command.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
      return message.reply(`Usage: \`${prefix}ban <@member> [reason]\``);
    }

    const hierarchyError = checkHierarchy(message, member, 'ban');
    if (hierarchyError) return message.reply(hierarchyError);

    if (!member.bannable) {
      return message.reply('I cannot ban that member — they may have a higher role than me.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.ban({ reason: `${message.author.tag}: ${reason}` });
      await logAction({
        guildId: message.guild.id,
        action: 'ban',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🔨 Member Banned')
        .addFields(
          { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[ban] Failed:', error);
      return message.reply('Failed to ban that member. Please try again.');
    }
  },
};
