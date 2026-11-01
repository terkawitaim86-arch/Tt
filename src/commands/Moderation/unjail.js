const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getSettings } = require('../../utils/guildSettings');
const { releaseJailRecord } = require('../../utils/jailManager');
const { getPrefix } = require('../../utils/prefixManager');
const {
  moderationEmbed,
  usageErrorEmbed,
  logCommandError,
} = require('../../utils/embedUtils');

const command = {
  name: 'unjail',
  description: 'Release a member from jail and restore their previous roles.',
  category: 'Moderation',
  usage: 'unjail <@member> [reason]',
  aliases: ['release'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return fail('You need the **Moderate Members** permission to use this command.', 'Missing permission');
    }

    const settings = await getSettings(message.guild.id);
    if (!settings.jail_role_id) {
      return fail(`No jail role is configured yet. An administrator can set one with \`${prefix}setjail\`.`, 'Jail not configured');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member you want to release.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const record = await releaseJailRecord(message.guild.id, member.id);
      if (!record) {
        return fail('That member is not in jail.', 'Not jailed');
      }

      const jailRole = message.guild.roles.cache.get(settings.jail_role_id);
      if (jailRole && member.roles.cache.has(jailRole.id)) {
        await member.roles.remove(jailRole, `Unjailed by ${message.author.tag}: ${reason}`);
      }

      const rolesToAdd = (record.previous_roles || []).filter((roleId) => {
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

      const embed = moderationEmbed({
        title: 'Member released',
        description: `A member was released from jail in **${message.guild.name}**.`,
        moderator: message.author,
        target: member,
        reason,
        extraFields: [{ name: 'Roles restored', value: String(rolesToAdd.length), inline: true }],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('unjail', error);
      return fail('I could not release that member. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
