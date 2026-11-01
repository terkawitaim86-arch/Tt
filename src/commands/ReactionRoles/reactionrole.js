const { PermissionFlagsBits } = require('discord.js');
const { addReactionRole } = require('../../utils/roleManager');
const { hasPermission, missingBotPermissions, describeDiscordError } = require('../../utils/permissions');
const { infoEmbed, successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { truncate } = require('../../utils/format');

const MAX_REACTIONS = 20;

const reply = (message, embed) => message.reply(replyOptions(embed));

function usage(message, description) {
  return reply(
    message,
    usageEmbed({
      command: 'reactionrole',
      syntax: 'reactionrole <title> | <emoji> <@role> | <emoji> <@role>',
      example: 'reactionrole Pick your colour | 🔴 @Red | 🔵 @Blue',
      description: description || 'Separate the title and each emoji/role pair with a pipe (|).',
    })
  );
}

module.exports = {
  name: 'reactionrole',
  description: 'Create a reaction role message. Members react to get a role.',
  category: 'Reaction Roles',
  usage: 'reactionrole <title> | <emoji1> <@role1> | <emoji2> <@role2> ...',
  aliases: ['rr'],
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
      PermissionFlagsBits.AddReactions,
    ]);
    if (missing) {
      return reply(
        message,
        errorEmbed({
          title: 'Missing bot permission',
          description: `I need the **${missing}** permission to create reaction roles here.`,
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

    if (rolePairs.length > MAX_REACTIONS) {
      return usage(message, `You can only add up to ${MAX_REACTIONS} reaction roles per message.`);
    }

    const entries = [];
    const seenEmoji = new Set();
    const botHighest = message.guild.members.me?.roles?.highest?.position ?? 0;

    for (const pair of rolePairs) {
      const match = pair.match(/^(\S+)\s+<@&(\d+)>$/);
      if (!match) {
        const hint = /<@!?\d+>/.test(pair) ? ' That mention is a user, not a role — mention the role itself.' : '';
        return usage(message, `Invalid entry: \`${truncate(pair, 80)}\`. Use \`<emoji> <@role>\`.${hint}`);
      }

      const emoji = match[1];
      const roleId = match[2];

      if (seenEmoji.has(emoji)) {
        return usage(message, `The emoji \`${emoji}\` is used twice. Each reaction needs a unique emoji.`);
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

      seenEmoji.add(emoji);
      entries.push({ emoji, role });
    }

    const embed = infoEmbed({
      title,
      description: 'React below to get your role!',
      fields: entries.map(({ emoji, role }) => ({ name: emoji, value: `<@&${role.id}>`, inline: true })),
      footer: 'ZMB • Reaction Roles',
    });

    let sentMessage;
    try {
      sentMessage = await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('[reactionrole] Failed to send message:', error.message);
      return reply(
        message,
        errorEmbed({
          title: 'Message not sent',
          description: describeDiscordError(error, 'Discord rejected the reaction role message.'),
        })
      );
    }

    let saved = 0;
    const failedReactions = [];

    for (const { emoji, role } of entries) {
      const stored = await addReactionRole({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: sentMessage.id,
        emoji,
        roleId: role.id,
      });
      if (stored) {
        saved += 1;
        try {
          await sentMessage.react(emoji);
        } catch (error) {
          console.error('[reactionrole] Failed to add reaction:', error.message);
          failedReactions.push(emoji);
        }
      }
    }

    if (saved === 0) {
      return reply(
        message,
        errorEmbed({
          title: 'Reaction roles not saved',
          description: 'The message was posted but no reaction roles were saved to the database, so reactions will not work. Please try again.',
        })
      );
    }

    const notes = [];
    if (saved < entries.length) {
      notes.push(`Only ${saved} of ${entries.length} reaction roles were saved.`);
    }
    if (failedReactions.length) {
      notes.push(`Could not add these reactions: ${failedReactions.join(', ')}.`);
    }

    return reply(
      message,
      successEmbed({
        title: 'Reaction Role Message Created',
        description: `${saved} reaction role${saved === 1 ? '' : 's'} ready. [Open the message](${sentMessage.url})${notes.length ? `\n\n${notes.join(' ')}` : ''}`,
        footer: 'ZMB • Reaction Roles',
      })
    );
  },
};
