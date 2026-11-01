const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { updateSettings } = require('../../utils/guildSettings');
const { getPrefix } = require('../../utils/prefixManager');
const { successEmbed, usageErrorEmbed, logCommandError, createBaseEmbed, COLORS } = require('../../utils/embedUtils');

const TYPE_MAP = {
  chat: 'log_chat_channel_id',
  server: 'log_server_channel_id',
  role: 'log_role_channel_id',
  mod: 'log_mod_channel_id',
};

const command = {
  name: 'setlogchannel',
  description: 'Set a log channel for a specific log type (chat, server, role, mod).',
  category: 'Logging',
  usage: 'setlogchannel <type> <#channel>',
  aliases: ['logchannel'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return fail('You need the **Manage Server** permission to use this command.', 'Missing permission');
    }

    const type = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first();

    if (!type || !TYPE_MAP[type]) {
      return fail(`Choose a log type: **${Object.keys(TYPE_MAP).join(', ')}**.`, 'Unknown log type');
    }

    if (!channel) {
      return fail('Mention the channel that should receive these logs.', 'No channel mentioned');
    }

    try {
      const success = await updateSettings(message.guild.id, { [TYPE_MAP[type]]: channel.id });

      if (!success) {
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'Log channel not saved',
              description: 'The setting could not be saved. Please try again.',
              color: COLORS.error,
              footerContext: 'Logging',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Log channel set',
            description: `**${type}** logs will now be posted in <#${channel.id}>.`,
            footerContext: 'Logging',
          }),
        ],
      });
    } catch (error) {
      logCommandError('setlogchannel', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Log channel not saved',
            description: 'The setting could not be saved. Please try again.',
            color: COLORS.error,
            footerContext: 'Logging',
          }),
        ],
      });
    }
  },
};

module.exports = command;
