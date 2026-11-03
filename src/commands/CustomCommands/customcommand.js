
const { PermissionFlagsBits } = require('discord.js');

const {
  getAllCustomCommands,
  createCustomCommand,
  deleteCustomCommand,
} = require('../../utils/customCommandManager');

const { getPrefix } = require('../../utils/prefixManager');

const {
  errorEmbed,
  usageEmbed,
  successEmbed,
  infoEmbed,
} = require('../../utils/embedUtils');

module.exports = {
  name: 'customcommand',
  description: 'Create, delete, or list custom commands.',
  category: 'Custom Commands',
  usage: 'customcommand <create|delete|list> [name] [response]',
  aliases: ['cc'],

  async execute(message, args, client) {
    if (!message.guild || !message.member) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'You need the **Manage Server** permission.',
          }),
        ],
      });
    }

    const prefix = await getPrefix(message.guild.id).catch(() => ',');

    const sub = args[0]?.toLowerCase();

    if (sub === 'create' || sub === 'add') {
      const name = args[1]?.toLowerCase();
      const response = args.slice(2).join(' ').trim();

      if (!name || !response) {
        return message.reply({
          embeds: [
            usageEmbed({
              command: 'customcommand create',
              syntax: `${prefix}cc create <name> <response>`,
              example: `${prefix}cc create hello Hello there!`,
            }),
          ],
        });
      }

      const commandName = name.trim();

      if (!/^[a-z0-9_-]{1,32}$/.test(commandName)) {
        return message.reply({
          embeds: [
            errorEmbed({
              description:
                'Command names can only contain letters, numbers, underscores and hyphens. Maximum length: 32 characters.',
            }),
          ],
        });
      }

      if (response.length > 2000) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: 'Custom command responses cannot exceed 2,000 characters.',
            }),
          ],
        });
      }

      const existingCommand = client?.commands?.get(commandName);

      if (existingCommand) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: 'That name is already used by one of ZMB OFFICIAL\'s commands or aliases.',
            }),
          ],
        });
      }

      const ok = await createCustomCommand(
        message.guild.id,
        commandName,
        response,
        message.author.id
      );

      if (!ok) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: 'Failed to save the custom command. Please try again.',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Custom Command Created',
            description: `**Command:** \`${prefix}${commandName}\`\n**Response:** ${response.slice(0, 200)}`,
          }),
        ],
        allowedMentions: { parse: [] },
      });
    }

    if (sub === 'delete' || sub === 'remove') {
      const name = args[1]?.toLowerCase();

      if (!name) {
        return message.reply({
          embeds: [
            usageEmbed({
              command: 'customcommand delete',
              syntax: `${prefix}cc delete <name>`,
            }),
          ],
        });
      }

      const ok = await deleteCustomCommand(message.guild.id, name);

      if (!ok) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: `No custom command named \`${name}\` was found.`,
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            description: `Successfully deleted custom command \`${name}\`.`,
          }),
        ],
      });
    }

    if (sub === 'list' || !sub) {
      const list = await getAllCustomCommands(message.guild.id);

      if (!list.length) {
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'Custom Commands',
              description: 'No custom commands have been created yet.',
            }),
          ],
        });
      }

      const commandList = list.map(
        (command) => `\`${prefix}${command.command_name}\``
      );

      const chunks = [];

      for (let i = 0; i < commandList.length; i += 40) {
        chunks.push(commandList.slice(i, i + 40));
      }

      const embeds = chunks.slice(0, 10).map((chunk, index) =>
        infoEmbed({
          title: chunks.length > 1
            ? `Custom Commands (${index + 1}/${chunks.length})`
            : 'Custom Commands',
          description: chunk.join('\n'),
          footer: `Total commands: ${list.length}`,
        })
      );

      return message.reply({
        embeds,
        allowedMentions: { parse: [] },
      });
    }

    return message.reply({
      embeds: [
        usageEmbed({
          command: 'customcommand',
          syntax: `${prefix}cc <create|delete|list> ...`,
          example: `${prefix}cc create hello Hello there!`,
        }),
      ],
    });
  },
};
