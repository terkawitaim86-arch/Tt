
const {
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

const { getPrefix } = require('../../utils/prefixManager');

const {
  errorEmbed,
  usageEmbed,
  successEmbed,
  infoEmbed,
} = require('../../utils/embedUtils');

const MAX_ANNOUNCEMENT_LENGTH = 4000;

module.exports = {
  name: 'announce',
  description: 'Send an announcement embed to a channel.',
  category: 'Utility',
  usage: 'announce <#channel> <message>',
  aliases: [],

  async execute(message, args) {
    if (!message.guild || !message.member) return;

    if (!message.member.permissions.has(
      PermissionFlagsBits.ManageMessages
    )) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'You need the **Manage Messages** permission.',
          }),
        ],
      });
    }

    const channel = message.mentions.channels.first();
    const text = args.slice(1).join(' ').trim();

    if (!channel || !text) {
      const prefix = await getPrefix(message.guild.id);

      return message.reply({
        embeds: [
          usageEmbed({
            command: 'announce',
            syntax: `${prefix}announce <#channel> <message>`,
          }),
        ],
      });
    }

    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement
    ) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'Please select a standard text or announcement channel.',
          }),
        ],
      });
    }

    if (text.length > MAX_ANNOUNCEMENT_LENGTH) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: `Announcements cannot exceed **${MAX_ANNOUNCEMENT_LENGTH.toLocaleString()} characters**.`,
          }),
        ],
      });
    }

    const botMember = message.guild.members.me;

    if (!botMember) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: 'I could not verify my server permissions.',
          }),
        ],
      });
    }

    const permissions = channel.permissionsFor(botMember);

    if (
      !permissions?.has(PermissionFlagsBits.ViewChannel) ||
      !permissions?.has(PermissionFlagsBits.SendMessages) ||
      !permissions?.has(PermissionFlagsBits.EmbedLinks)
    ) {
      return message.reply({
        embeds: [
          errorEmbed({
            description: `I need **View Channel**, **Send Messages**, and **Embed Links** permissions in <#${channel.id}>.`,
          }),
        ],
      });
    }

    try {
      await channel.send({
        embeds: [
          infoEmbed({
            title: '📢 Announcement',
            description: text,
            footer: `Posted by ${message.author.tag}`,
          }),
        ],
        allowedMentions: {
          parse: [],
        },
      });

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Announcement Published',
            description: `Your announcement was successfully sent to <#${channel.id}>.`,
          }),
        ],
      });
    } catch (error) {
      console.error('[Announce] Failed to send:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            description: 'I couldn't send the announcement. Check my channel permissions and try again.',
          }),
        ],
      });
    }
  },
};
