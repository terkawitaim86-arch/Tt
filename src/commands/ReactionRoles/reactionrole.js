const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { addReactionRole } = require('../../utils/roleManager');
const { getPrefix } = require('../../utils/prefixManager');
const {
  infoEmbed,
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  createBaseEmbed,
  truncate,
  COLORS,
  LIMITS,
} = require('../../utils/embedUtils');

const MAX_ROLES = Math.min(20, LIMITS.fields);

const command = {
  name: 'reactionrole',
  description: 'Create a reaction role message. Members react to get a role.',
  category: 'Reaction Roles',
  usage: 'reactionrole <title> | <emoji1> <@role1> | <emoji2> <@role2> ...',
  aliases: ['rr'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return fail('You need the **Manage Roles** permission to use this command.', 'Missing permission');
    }

    const parts = args.join(' ').split('|').map((part) => part.trim()).filter(Boolean);

    if (parts.length < 3) {
      return fail('Provide a title and at least two emoji and role pairs separated by `|`.', 'Not enough options');
    }

    const title = truncate(parts[0], LIMITS.title);
    const rolePairs = parts.slice(1);

    if (rolePairs.length > MAX_ROLES) {
      return fail(`A reaction role message supports at most ${MAX_ROLES} roles.`, 'Too many roles');
    }

    const parsed = [];

    for (const pair of rolePairs) {
      const match = pair.match(/^(\S+)\s+<@&(\d+)>$/);
      if (!match) {
        return fail(`\`${truncate(pair, 60)}\` is not a valid option. Use \`<emoji> <@role>\`.`, 'Invalid option');
      }

      const emoji = match[1];
      const roleId = match[2];
      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        return fail(`The role in \`${truncate(pair, 60)}\` no longer exists.`, 'Role not found');
      }

      parsed.push({ emoji, roleId });
    }

    try {
      const embed = infoEmbed({
        title,
        description: 'React below to receive the matching role.',
        fields: parsed.map((entry) => ({ name: entry.emoji, value: `<@&${entry.roleId}>`, inline: true })),
        footerContext: 'Reaction roles',
      });

      const sentMessage = await message.channel.send({ embeds: [embed] });

      for (const entry of parsed) {
        await addReactionRole({
          guildId: message.guild.id,
          channelId: message.channel.id,
          messageId: sentMessage.id,
          emoji: entry.emoji,
          roleId: entry.roleId,
        });
        await sentMessage.react(entry.emoji).catch(() => {});
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Reaction roles published',
            description: `Members can now react for **${parsed.length}** role${parsed.length === 1 ? '' : 's'} in ${message.channel}.`,
            fields: [{ name: 'Message', value: `[Jump to message](${sentMessage.url})`, inline: false }],
            footerContext: 'Reaction roles',
          }),
        ],
      });
    } catch (error) {
      logCommandError('reactionrole', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Reaction roles not created',
            description: 'The reaction role message could not be created. Please try again.',
            color: COLORS.error,
            footerContext: 'Reaction roles',
          }),
        ],
      });
    }
  },
};

module.exports = command;
