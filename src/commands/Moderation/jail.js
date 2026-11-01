const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getSettings } = require('../../utils/guildSettings');
const { createJailRecord, getJailRecord } = require('../../utils/jailManager');
const { getPrefix } = require('../../utils/prefixManager');
const {
  moderationEmbed,
  usageErrorEmbed,
  logCommandError,
  inlineCode,
} = require('../../utils/embedUtils');

const command = {
  name: 'jail',
  description: 'Send a member to jail by removing their roles and assigning the jail role.',
  category: 'Moderation',
  usage: 'jail <@member> [reason]',
  aliases: ['isolated', 'muteold'],
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

    const jailRole = message.guild.roles.cache.get(settings.jail_role_id);
    if (!jailRole) {
      return fail(
        `The configured jail role no longer exists. Set a new one with \`${prefix}setjail\`.`,
        'Jail not configured'
      );
    }

    const member = message.mentions.members.first();
    if (!member) {
      return fail('Mention the member you want to jail.');
    }

    if (member.id === message.author.id) {
      return fail('You cannot jail yourself.', 'Invalid target');
    }

    if (!member.manageable) {
      return fail('I cannot manage that member — they may have a higher role than me.', 'Member cannot be jailed');
    }

    const existing = await getJailRecord(message.guild.id, member.id);
    if (existing) {
      return fail('That member is already in jail.', 'Already jailed');
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
          await jailChannel
            .send(`<@${member.id}>, you have been placed in jail. Reason: ${reason}`)
            .catch(() => {});
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

      const embed = moderationEmbed({
        title: 'Member jailed',
        description: `A member was jailed in **${message.guild.name}**.`,
        moderator: message.author,
        target: member,
        reason,
        extraFields: [
          { name: 'Jail role', value: `<@&${jailRole.id}>`, inline: true },
          { name: 'Roles removed', value: String(previousRoles.length), inline: true },
        ],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('jail', error);
      return fail('I could not jail that member. Please try again.', 'Action failed');
    }
  },
};

module.exports = command;
