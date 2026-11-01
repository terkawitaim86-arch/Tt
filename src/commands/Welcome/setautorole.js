const { PermissionFlagsBits } = require('discord.js');
const { updateSettings } = require('../../utils/guildSettings');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'setautorole',
  description: 'Set a role automatically given to new members.',
  category: 'Welcome',
  usage: 'setautorole <@role>',
  aliases: ['autorole'],
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

    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'setautorole',
            syntax: 'setautorole <@role>',
            example: 'setautorole @Member',
            description: 'Mention the role that new members should receive.',
          })
        )
      );
    }

    if (role.managed || role.id === message.guild.id) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Role not assignable',
            description: 'That role is managed by an integration and cannot be used as an auto role.',
          })
        )
      );
    }

    const success = await updateSettings(message.guild.id, { auto_role_id: role.id });

    if (!success) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Auto role not saved',
            description: 'Failed to save the auto role. Please try again.',
          })
        )
      );
    }

    return message.reply(
      replyOptions(
        successEmbed({
          title: 'Auto Role Set',
          description: 'New members will receive this role when they join.',
          fields: [{ name: 'Role', value: `<@&${role.id}>`, inline: true }],
          footer: 'ZMB • Welcome',
        })
      )
    );
  },
};
