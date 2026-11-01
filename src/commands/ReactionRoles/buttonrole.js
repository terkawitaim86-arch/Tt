const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addButtonRole } = require('../../utils/roleManager');
const { hasPermission, missingBotPermissions, describeDiscordError } = require('../../utils/permissions');
const { infoEmbed, successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { truncate } = require('../../utils/format');

const MAX_BUTTONS = 25;
const MAX_LABEL = 80;

const reply = (message, embed) => message.reply(replyOptions(embed));

function usage(message, description) {
  return reply(
    message,
    usageEmbed({
      command: 'buttonrole',
      syntax: 'buttonrole <title> | <label> <@role> | <label> <@role>',
      example: 'buttonrole Pick your ping | Announcements @News | Events @Events',
      description: description || 'Separate the title and each label/role pair with a pipe (|).',
    })
  );
}

module.exports = {
  name: 'buttonrole',
  description: 'Create a button role message. Members click a button to get a role.',
  category: 'Reaction Roles',
  usage: 'buttonrole <title> | <label1> <@role1> | <label2> <@role2> ...',
  aliases: ['br'],
  async execute(message, args, client) {
    if (!hasPermission(message.member, PermissionFlagsBits.ManageRoles)) {
      return reply(
        message,
        errorEmbed({
          title: 'Missing permission',
          description: 'You need the **Manage Roles** permission to use this command.',
        })
      );
    }

    const missing = missingBotPermissions(message.guild, [
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
    ]);
    if (missing) {
      return reply(
        message,
        errorEmbed({
          title: 'Missing bot permission',
          description: `I need the **${missing}** permission to create button roles here.`,
        })
      );
    }

    const fullText = args.join(' ').trim();
    const parts = fullText.split('|').map((part) => part.trim()).filter(Boolean);

    if (parts.length < 3) {
      return usage(message);
    }

    const title = truncate(parts[0], 256);
    const rolePairs = parts.slice(1);

    if (rolePairs.length > MAX_BUTTONS) {
      return usage(message, `You can only have up to ${MAX_BUTTONS} buttons (5 rows of 5).`);
    }

    const entries = [];
    const seenLabels = new Set();
    const botHighest = message.guild.members.me?.roles?.highest?.position ?? 0;

    for (const pair of rolePairs) {
      const match = pair.match(/^(.+?)\s+<@&(\d+)>$/);
      if (!match) {
        return usage(message, `Invalid entry: \`${truncate(pair, 80)}\`. Use \`<label> <@role>\`.`);
      }

      const label = match[1].trim();
      const roleId = match[2];

      if (!label) {
        return usage(message, `The entry \`${truncate(pair, 80)}\` is missing a button label.`);
      }
      if (label.length > MAX_LABEL) {
        return usage(message, `The label \`${truncate(label, 40)}\` is longer than ${MAX_LABEL} characters.`);
      }
      if (seenLabels.has(label.toLowerCase())) {
        return usage(message, `The label \`${label}\` is used twice. Labels must be unique.`);
      }

      const role = message.guild.roles.cache.get(roleId);
      if (!role) {
        return reply(
          message,
          errorEmbed({
            title: 'Role not found',
            description: `No role matches \`${roleId}\`. Mention the role directly so it is valid.`,
          })
        );
      }
      if (role.managed || role.id === message.guild.id) {
        return reply(
          message,
          errorEmbed({
            title: 'Role not assignable',
            description: `<@&${role.id}> is managed by an integration or is \`@everyone\`, so it cannot be handed out.`,
          })
        );
      }
      if (role.position >= botHighest) {
        return reply(
          message,
          errorEmbed({
            title: 'Role too high',
            description: `<@&${role.id}> is above my highest role, so I cannot assign it. Move my role higher.`,
          })
        );
      }

      seenLabels.add(label.toLowerCase());
      entries.push({ label, role });
    }

    const embed = infoEmbed({
      title,
      description: 'Click a button below to get your role!',
      fields: entries.map(({ label, role }) => ({ name: label, value: `<@&${role.id}>`, inline: true })),
      footer: 'ZMB • Button Roles',
    });

    const rows = [];
    for (let i = 0; i < entries.length; i += 5) {
      const row = new ActionRowBuilder();
      for (const { label } of entries.slice(i, i + 5)) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(label)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary)
        );
      }
      rows.push(row);
    }

    let sentMessage;
    try {
      sentMessage = await message.channel.send({ embeds: [embed], components: rows });
    } catch (error) {
      console.error('[buttonrole] Failed to send message:', error.message);
      return reply(
        message,
        errorEmbed({
          title: 'Message not sent',
          description: describeDiscordError(error, 'Discord rejected the button role message.'),
        })
      );
    }

    let saved = 0;
    for (const { label, role } of entries) {
      const stored = await addButtonRole({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: sentMessage.id,
        label,
        style: ButtonStyle.Secondary,
        roleId: role.id,
      });
      if (stored) {
        saved += 1;
      }
    }

    if (saved === 0) {
      return reply(
        message,
        errorEmbed({
          title: 'Buttons not saved',
          description: `The message was posted but no buttons were saved to the database, so clicking them will not work. Please try again.`,
        })
      );
    }

    const warning = saved < entries.length
      ? `\n\nOnly ${saved} of ${entries.length} buttons were saved — the rest will not work.`
      : '';

    return reply(
      message,
      successEmbed({
        title: 'Button Role Message Created',
        description: `${entries.length} button${entries.length === 1 ? '' : 's'} ready. [Open the message](${sentMessage.url})${warning}`,
        footer: 'ZMB • Button Roles',
      })
    );
  },
};
