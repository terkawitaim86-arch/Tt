const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');
const { getPrefix } = require('../../utils/prefixManager');
const {
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  inlineCode,
} = require('../../utils/embedUtils');

const command = {
  name: 'setjail',
  description: 'Configure the jail role and jail channel.',
  category: 'Moderation',
  usage: 'setjail <role> [channel]',
  aliases: ['setjailrole'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const role = message.mentions.roles.first();
    const channel = message.mentions.channels.first();

    if (!role) {
      return fail('Mention the role that should mark jailed members.');
    }

    const updates = { jail_role_id: role.id };
    if (channel) {
      updates.jail_channel_id = channel.id;
    }

    try {
      const success = await updateSettings(message.guild.id, updates);

      if (!success) {
        return fail('I could not save the jail settings. Please try again.', 'Save failed');
      }

      const embed = successEmbed({
        title: 'Jail configuration updated',
        description: `New jailers will now receive ${role} in **${message.guild.name}**.`,
        fields: [
          { name: 'Jail role', value: `${role} (${inlineCode(role.id)})`, inline: false },
          {
            name: 'Jail channel',
            value: channel ? `${channel}` : 'Unchanged — jailed members use the previous channel',
            inline: false,
          },
          { name: 'Next step', value: `Use \`${prefix}jail <@member>\` to move a member into jail.`, inline: false },
        ],
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logCommandError('setjail', error);
      return fail('I could not save the jail settings. Please try again.', 'Save failed');
    }
  },
};

module.exports = command;
