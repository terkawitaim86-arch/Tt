const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { addButtonRole } = require('../../utils/roleManager');
const { getPrefix } = require('../../utils/prefixManager');
const {
  infoEmbed,
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  createBaseEmbed,
  truncate,
  COLORS,
} = require('../../utils/embedUtils');

const MAX_BUTTONS = 25;
const MAX_LABEL = 80;

const command = {
  name: 'buttonrole',
  description: 'Create a button role message. Members click a button to get a role.',
  category: 'Reaction Roles',
  usage: 'buttonrole <title> | <label1> <@role1> | <label2> <@role2> ...',
  aliases: ['br'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return fail('You need the **Manage Roles** permission to use this command.', 'Missing permission');
    }

    const parts = args.join(' ').split('|').map((part) => part.trim()).filter(Boolean);

    if (parts.length < 3) {
      return fail('Provide a title and at least two label and role pairs separated by `|`.', 'Not enough options');
    }

    const title = truncate(parts[0], 256);
    const rolePairs = parts.slice(1);

    if (rolePairs.length > MAX_BUTTONS) {
      return fail(`A button role message supports at most ${MAX_BUTTONS} buttons.`, 'Too many buttons');
    }

    const parsed = [];

    for (const pair of rolePairs) {
      const match = pair.match(/^(.+?)\s+<@&(\d+)>$/);
      if (!match) {
        return fail(`\`${truncate(pair, 60)}\` is not a valid option. Use \`<label> <@role>\`.`, 'Invalid option');
      }

      const label = match[1].trim();
      const roleId = match[2];
      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        return fail(`The role in \`${truncate(pair, 60)}\` no longer exists.`, 'Role not found');
      }

      if (label.length > MAX_LABEL) {
        return fail(`The label for ${role} is longer than ${MAX_LABEL} characters.`, 'Label too long');
      }

      parsed.push({ label, roleId });
    }

    try {
      const embed = infoEmbed({
        title,
        description: 'Click a button below to receive the matching role.',
        fields: parsed.map((entry) => ({ name: entry.label, value: `<@&${entry.roleId}>`, inline: true })),
        footerContext: 'Button roles',
      });

      const rows = [];
      let currentRow = new ActionRowBuilder();
      let buttonsInRow = 0;

      for (const entry of parsed) {
        currentRow.addComponents(
          new ButtonBuilder().setCustomId(entry.label).setLabel(entry.label).setStyle(ButtonStyle.Secondary)
        );
        buttonsInRow += 1;

        if (buttonsInRow === 5) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
          buttonsInRow = 0;
        }
      }

      if (buttonsInRow > 0) rows.push(currentRow);

      const sentMessage = await message.channel.send({ embeds: [embed], components: rows });

      for (const entry of parsed) {
        await addButtonRole({
          guildId: message.guild.id,
          channelId: message.channel.id,
          messageId: sentMessage.id,
          label: entry.label,
          style: 2,
          roleId: entry.roleId,
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Button roles published',
            description: `Members can now claim **${parsed.length}** role${parsed.length === 1 ? '' : 's'} in ${message.channel}.`,
            fields: [{ name: 'Message', value: `[Jump to message](${sentMessage.url})`, inline: false }],
            footerContext: 'Button roles',
          }),
        ],
      });
    } catch (error) {
      logCommandError('buttonrole', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Button roles not created',
            description: 'The button role message could not be created. Please try again.',
            color: COLORS.error,
            footerContext: 'Button roles',
          }),
        ],
      });
    }
  },
};

module.exports = command;
