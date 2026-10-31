const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'kick',
  description: 'Kick a member from the server.',
  category: 'Moderation',
  usage: 'kick <@member> [reason]',
  aliases: [],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('You need the **Kick Members** permission to use this command.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
      return message.reply(`Usage: \`${prefix}kick <@member> [reason]\``);
    }

    if (member.id === message.author.id) {
      return message.reply('You cannot kick yourself.');
    }

    if (!member.kickable) {
      return message.reply('I cannot kick that member — they may have a higher role than me.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.kick(`${message.author.tag}: ${reason}`);
      await logAction({
        guildId: message.guild.id,
        action: 'kick',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('👢 Member Kicked')
        .addFields(
          { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[kick] Failed:', error);
      return message.reply('Failed to kick that member. Please try again.');
    }
  },
};
