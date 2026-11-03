
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
  aliases: ['b', 'banish'],

  async execute(message, args) {
    if (!message.guild || !message.member) return;

    // Moderator permissions
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Permission Denied',
            description: 'You need the **Ban Members** permission to use this command.',
          }),
        ],
      });
    }

    // Bot permissions
    const botMember = message.guild.members.me;

    if (
      !botMember ||
      !botMember.permissions.has(PermissionFlagsBits.BanMembers)
    ) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Bot Permission Missing',
            description: 'I need the **Ban Members** permission to ban members.',
          }),
        ],
      });
    }

    // Target member
    const member = message.mentions.members.first();

    if (!member) {
      const prefix = await getPrefix(message.guild.id)
        .catch(() => config.defaultPrefix || ',');

      return message.reply({
        embeds: [
          usageEmbed({
            command: 'Ban Member',
            syntax: `${prefix}ban <@member> [reason]`,
            example: `${prefix}ban @John Breaking server rules`,
            description: 'Permanently ban a member from this server.',
          }),
        ],
      });
    }

    // Target validation
    if (member.id === message.author.id) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Invalid Target',
            description: 'You cannot ban yourself.',
          }),
        ],
      });
    }

    if (member.id === message.client.user.id) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Invalid Target',
            description: 'I cannot ban myself.',
          }),
        ],
      });
    }

    if (member.id === message.guild.ownerId) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Protected Member',
            description: 'The server owner cannot be banned.',
          }),
        ],
      });
    }

    // Moderator hierarchy
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
            title: 'Role Hierarchy',
            description: 'You cannot ban a member with an equal or higher role than yours.',
          }),
        ],
      });
    }

    // Bot hierarchy
    if (!member.bannable) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Cannot Ban Member',
            description: 'My highest role must be above the target member’s highest role.',
          }),
        ],
      });
    }

    const reason = (
      args.slice(1).join(' ').trim() || 'No reason provided'
    ).slice(0, MAX_REASON_LENGTH);

    try {
      await member.ban({
        reason: `${message.author.tag}: ${reason}`.slice(0, 512),
      });

      // Moderation logging
      try {
        await logAction({
          guildId: message.guild.id,
          action: 'ban',
          targetId: member.id,
          moderatorId: message.author.id,
          reason,
        });
      } catch (logError) {
        console.error('[Ban] Logging failed:', logError);
      }

      // Success embed
      return message.reply({
        embeds: [
          modEmbed({
            title: '🔨 Member Banned',
            description: `**${member.user.tag}** has been successfully banned from the server.`,
            color: 0xED4245,
            thumbnail: member.user.displayAvatarURL({ size: 256 }),
            fields: [
              {
                name: '👤 Banned Member',
                value: `<@${member.id}>\n\`${member.id}\``,
                inline: true,
              },
              {
                name: '🛡️ Moderator',
                value: `<@${message.author.id}>`,
                inline: true,
              },
              {
                name: '📝 Reason',
                value: reason,
                inline: false,
              },
              {
                name: '📌 Action',
                value: 'Permanent Ban',
                inline: true,
              },
              {
                name: '🏠 Server',
                value: message.guild.name,
                inline: true,
              },
            ],
            footer: 'ZMB OFFICIAL • Moderation System',
          }),
        ],
        allowedMentions: { parse: [] },
      });

    } catch (error) {
      console.error('[Ban] Failed:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Ban Failed',
            description: 'The ban could not be completed. Check my permissions and the target member’s role hierarchy.',
          }),
        ],
      });
    }
  },
};
