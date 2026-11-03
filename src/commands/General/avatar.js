
const {
  UserFlags,
} = require('discord.js');

const { infoEmbed, errorEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'avatar',
  description: "Shows a member's avatar.",
  category: 'General',
  usage: 'avatar [@user/user ID]',
  aliases: ['av', 'pfp'],

  async execute(message, args) {
    if (!message.guild) return;

    try {
      let user = message.mentions.users.first();

      // Allow lookup by user ID.
      if (!user && args[0] && /^\d{17,20}$/.test(args[0])) {
        user = await message.client.users.fetch(args[0])
          .catch(() => null);
      }

      // Default to the command author.
      if (!user) {
        user = message.author;
      }

      const avatarUrl = user.displayAvatarURL({
        size: 4096,
        extension: 'png',
        forceStatic: true,
      });

      const embed = infoEmbed({
        title: `${user.username}'s Avatar`,
        description: [
          `[Open Full Size](${avatarUrl})`,
          '',
          `**User:** ${user}`,
          `**ID:** \`${user.id}\``,
        ].join('\n'),
        image: avatarUrl,
        footer: 'ZMB OFFICIAL • Avatar Viewer',
      });

      return message.reply({
        embeds: [embed],
        allowedMentions: {
          users: [user.id],
        },
      });
    } catch (error) {
      console.error('[Avatar] Error:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            description: 'I could not retrieve that avatar. Please try again.',
          }),
        ],
      });
    }
  },
};
