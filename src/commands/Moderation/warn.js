const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { guardModeration, describeDiscordError } = require('../../utils/permissions');
const { truncate } = require('../../utils/format');
const { addWarning, logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'warn',
  description: 'Warn a member. Warnings can be reviewed with the warnings command.',
  category: 'Moderation',
  usage: 'warn <@member> [reason]',
  aliases: ['w'],
  async execute(message, args) {
    const prefix = await getPrefix(message.guild.id);
    const member = message.mentions.members.first();

    if (!member) {
      return message.reply(replyOptions(usageEmbed({
        command: 'warn',
        syntax: `${prefix}warn <@member> [reason]`,
        example: `${prefix}warn @Member Stop spamming`,
      })));
    }

    const denied = guardModeration(message, {
      permission: PermissionFlagsBits.ModerateMembers,
      permissionLabel: 'Moderate Members',
      botPermissions: {},
      target: member,
      actionName: 'warn',
      command: 'warn',
    });
    if (denied) return message.reply(replyOptions(denied));

    const reason = truncate(args.slice(1).join(' ') || 'No reason provided', 900);

    let warningId;
    try {
      warningId = await addWarning({
        guildId: message.guild.id,
        userId: member.id,
        moderatorId: message.author.id,
        reason,
      });
    } catch (error) {
      console.error(`[warn] Failed to store warning for ${member.id}:`, error.message);
      warningId = null;
    }

    if (!warningId) {
      return message.reply(replyOptions(errorEmbed({
        title: 'Warning not saved',
        description: describeDiscordError(null, 'The warning could not be saved to the database, so it was not recorded.'),
        footer: 'ZMB • warn',
      })));
    }

    await logAction({
      guildId: message.guild.id,
      action: 'warn',
      targetId: member.id,
      moderatorId: message.author.id,
      reason,
    });

    await member
      .send(`You received a warning in **${message.guild.name}**: ${reason}`)
      .catch((error) => console.error(`[warn] Could not DM ${member.id}:`, error.code || error.message));

    return message.reply(replyOptions(successEmbed({
      title: 'Member warned',
      description: `<@${member.id}> has been warned.`,
      footer: `Warning ID: ${String(warningId).slice(0, 8)}`,
      fields: [
        { name: 'Member', value: `\`${member.id}\``, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
      ],
    })));
  },
};
