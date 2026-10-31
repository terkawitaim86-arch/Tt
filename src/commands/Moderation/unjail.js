const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getSettings } = require('../../utils/guildSettings');
const { releaseJailRecord } = require('../../utils/jailManager');

module.exports = {
  name: 'unjail',
  description: 'Release a member from jail and restore their previous roles.',
  category: 'Moderation',
  usage: 'unjail <@member> [reason]',
  aliases: ['release'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('You need the **Moderate Members** permission to use this command.');
    }

    const settings = await getSettings(message.guild.id);
    if (!settings.jail_role_id) {
      return message.reply('No jail role is configured.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('Usage: `unjail <@member> [reason]`');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const record = await releaseJailRecord(message.guild.id, member.id);
      if (!record) {
        return message.reply('That member is not in jail.');
      }

      const jailRole = message.guild.roles.cache.get(settings.jail_role_id);
      if (jailRole && member.roles.cache.has(jailRole.id)) {
        await member.roles.remove(jailRole, `Unjailed by ${message.author.tag}: ${reason}`);
      }

      const rolesToAdd = record.previous_roles.filter((roleId) => {
        const role = message.guild.roles.cache.get(roleId);
        return role && role.position < message.guild.members.me.roles.highest.position;
      });

      if (rolesToAdd.length > 0) {
        await member.roles.add(rolesToAdd, `Unjailed by ${message.author.tag}: ${reason}`);
      }

      await logAction({
        guildId: message.guild.id,
        action: 'unjail',
        targetId: member.id,
        moderatorId: message.author.id,
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🔓 Member Released')
        .addFields(
          { name: 'Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: false },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Roles Restored', value: `${rolesToAdd.length} role(s)`, inline: true }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[unjail] Failed:', error);
      return message.reply('Failed to unjail that member. Please try again.');
    }
  },
};
