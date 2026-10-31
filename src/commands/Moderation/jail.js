const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getSettings } = require('../../utils/guildSettings');
const { createJailRecord, getJailRecord } = require('../../utils/jailManager');

module.exports = {
  name: 'jail',
  description: 'Send a member to jail by removing their roles and assigning the jail role.',
  category: 'Moderation',
  usage: 'jail <@member> [reason]',
  aliases: ['isolated', 'muteold'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You need the **Moderate Members** permission to use this command.');
    }

    const settings = await getSettings(message.guild.id);
    if (!settings.jail_role_id) {
      return message.reply('No jail role is configured. Use `,setjailrole <@role>` to set one.');
    }

    const jailRole = message.guild.roles.cache.get(settings.jail_role_id);
    if (!jailRole) {
      return message.reply('The configured jail role no longer exists. Please set a new one with `,setjailrole`.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Usage: `jail <@member> [reason]`');
    }

    if (member.id === message.author.id) {
      return message.reply('You cannot jail yourself.');
    }

    if (!member.manageable) {
      return message.reply('I cannot manage that member — they may have a higher role than me.');
    }

    const existing = await getJailRecord(message.guild.id, member.id);
    if (existing) {
      return message.reply('That member is already in jail.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const previousRoles = member.roles.cache
      .filter((r) => r.id !== message.guild.id)
      .map((r) => r.id);

    try {
      await member.roles.remove(previousRoles, `Jailed by ${message.author.tag}: ${reason}`);
      await member.roles.add(jailRole, `Jailed by ${message.author.tag}: ${reason}`);

      if (settings.jail_channel_id) {
        const jailChannel = message.guild.channels.cache.get(settings.jail_channel_id);
        if (jailChannel) {
          await jailChannel.send(`<@${member.id}>, you have been placed in jail. Reason: ${reason}`).catch(() => {});
        }
      }

      await createJailRecord(message.guild.id, member.id, previousRoles, message.author.id, reason);
      await logAction({
        guildId: message.guild.id,
        action: 'jail',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🚔 Member Jailed')
        .addFields(
          { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[jail] Failed:', error);
      return message.reply('Failed to jail that member. Please try again.');
    }
  },
};
