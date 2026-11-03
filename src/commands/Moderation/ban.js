
const { PermissionFlagsBits } = require('discord.js');

const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getPrefix } = require('../../utils/prefixManager');

const {
  errorEmbed,
  usageEmbed,
  modEmbed,
} = require('../../utils/embedUtils');

const MAX_REASON_LENGTH = 400;

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server.',
  category: 'Moderation',
  usage: 'ban <@member> [reason]',
  aliases: ['b'],

  async execute(message, args) {
    if (!message.guild || !message.member) return;

    // Check moderator permissions.
    if (!message.member.permissions.has(
      PermissionFlagsBits.BanMembers
    )) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Missing Permission',
            description: 'You need the **Ban Members** permission to use this command.',
          }),
        ],
      });
    }

    // Check bot permissions.
    const botMember = message.guild.members.me;

    if (
      !botMember ||
      !botMember.permissions.has(PermissionFlagsBits.BanMembers)
    ) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Missing Bot Permission',
            description: 'I need the **Ban Members** permission to perform this action.',
          }),
        ],
      });
    }

    // Find the target member.
    const member = message.mentions.members.first();

    if (!member) {
      const prefix = await getPrefix(message.guild.id)
        .catch(() => config.defaultPrefix || ',');

      return message.reply({
        embeds: [
          usageEmbed({
            command: 'ban',
            syntax: `${prefix}ban <@member> [reason]`,
            example: `${prefix}b @user Breaking rules`,
            description: 'Ban a member from the server. Alias: `b`',
          }),
        ],
      });
    }

    // Prevent invalid targets.
    if (member.id === message.author.id) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'You cannot ban yourself.',
          }),
        ],
      });
    }

    if (member.id === message.client.user.id) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'I cannot ban myself.',
          }),
        ],
      });
    }

    if (member.id === message.guild.ownerId) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'The server owner cannot be banned.',
          }),
        ],
      });
    }

    // Check moderator role hierarchy.
    const isOwner = message.guild.ownerId === message.author.id;

    if (
      !isOwner &&
      member.roles.highest.comparePositionTo(
        message.member.roles.highest
      ) >= 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'You cannot ban someone with an equal or higher role than yours.',
          }),
        ],
      });
    }

    // Check bot role hierarchy.
    if (!member.bannable) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'I cannot ban that member. Their highest role may be above mine.',
          }),
        ],
      });
    }

    const reason = (
      args.slice(1).join(' ').trim() || 'No reason provided'
    ).slice(0, MAX_REASON_LENGTH);

    try {
      // Perform the ban.
      await member.ban({
        reason: `${message.author.tag}: ${reason}`.slice(0, 512),
      });

      // Log separately so logging failure doesn't undo a successful ban.
      try {
        await logAction({
          guildId: message.guild.id,
          action: 'ban',
          targetId: member.id,
          moderatorId: message.author.id,
          reason,
        });
      } catch (logError) {
        console.error('[Ban] Moderation logging failed:', logError);
      }

      // Confirm successful ban.
      return message.reply({
        embeds: [
          modEmbed({
            title: 'Member Banned',
            description: `<@${member.id}> has been banned from the server.`,
            color: 0xED4245,
            thumbnail: member.user.displayAvatarURL({
              size: 256,
            }),
            fields: [
              {
                name: 'Member',
                value: `${member.user.tag}\n\`${member.id}\``,
                inline: true,
              },
              {
                name: 'Moderator',
                value: `<@${message.author.id}>`,
                inline: true,
              },
              {
                name: 'Reason',
                value: reason,
                inline: false,
              },
            ],
            footer: 'ZMB OFFICIAL • Moderation',
          }),
        ],
        allowedMentions: {
          parse: [],
        },
      });
    } catch (error) {
      console.error('[Ban] Failed:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Ban Failed',
            description: 'I could not ban that member. Check my permissions and try again.',
          }),
        ],
      });
    }
  },
};
