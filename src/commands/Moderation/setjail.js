const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration } = require('../../utils/permissions');
const { updateSettings } = require('../../utils/guildSettings');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'setjail',
  description: 'Configure the jail role and jail channel.',
  category: 'Moderation',
  usage: 'setjail <@role> [#channel]',
  aliases: ['setjailrole'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const role = message.mentions.roles.first();
    const channel = message.mentions.channels.first();

    if (!role) {
      return message.reply(replyOptions(usageEmbed({
        command: 'setjail',
        syntax: `${prefix}setjail <@role> [#channel]`,
        example: `${prefix}setjail @Jailed #jail`,
        description: 'Sets the jail role and, optionally, the channel used for jail notices.',
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ManageGuild,
      permissionLabel: 'Manage Server',
      command: 'setjail',
    });
    if (denied) return message.reply(replyOptions(denied));

    if (role.managed) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Invalid jail role',
        description: 'That role is managed by an integration and cannot be used as a jail role.',
        footer: 'ZMB • setjail',
      })));
    }

    const botHighest = message.guild.members.me.roles.highest.position;
    if (role.position >= botHighest) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Role hierarchy',
        description: 'The jail role must be below my highest role so I can assign it.',
        footer: 'ZMB • setjail',
      })));
    }

    const patch = { jail_role_id: role.id };
    if (channel) patch.jail_channel_id = channel.id;

    const saved = await updateSettings(message.guild.id, patch);
    if (saved === false) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Could not save settings',
        description: 'The jail configuration could not be written to the database. Please try again.',
        footer: 'ZMB • setjail',
      })));
    }

    const fields = [{ name: 'Jail role', value: `<@&${role.id}>`, inline: true }];
    if (channel) fields.push({ name: 'Jail channel', value: `<#${channel.id}>`, inline: true });

    return message.reply(replyOptions(successEmbed({
      title: 'Jail configured',
      description: 'The jail settings were saved.',
      footer: 'ZMB • setjail',
      fields,
    })));
  },
};
