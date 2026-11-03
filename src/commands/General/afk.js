
const {
  setAfk,
  removeAfk,
  getAfk,
} = require('../../utils/afkManager');

const {
  successEmbed,
  infoEmbed,
  errorEmbed,
} = require('../../utils/embedUtils');

const MAX_REASON_LENGTH = 200;

module.exports = {
  name: 'afk',
  description: 'Set an AFK status. Automatically removed when you send a message.',
  category: 'General',
  usage: 'afk [reason]',
  aliases: [],

  async execute(message, args) {
    if (!message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    try {
      const existing = await getAfk(guildId, userId);

      if (existing) {
        const removed = await removeAfk(guildId, userId);

        if (!removed) {
          return message.reply({
            embeds: [
              errorEmbed({
                description: 'Could not remove your AFK status. Please try again.',
              }),
            ],
          });
        }

        return message.reply({
          embeds: [
            successEmbed({
              title: 'Welcome Back!',
              description: `<@${userId}>, your AFK status has been removed.`,
            }),
          ],
          allowedMentions: { users: [userId] },
        });
      }

      const reason = args.join(' ').trim() || 'AFK';

      if (reason.length > MAX_REASON_LENGTH) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: `Your AFK reason cannot exceed **${MAX_REASON_LENGTH} characters**.`,
            }),
          ],
        });
      }

      const saved = await setAfk(guildId, userId, reason);

      if (!saved) {
        return message.reply({
          embeds: [
            errorEmbed({
              description: 'Could not save your AFK status. Please try again.',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          infoEmbed({
            title: 'AFK Status Set',
            description: `<@${userId}> is now AFK: **${reason}**`,
          }),
        ],
        allowedMentions: { users: [userId] },
      });
    } catch (error) {
      console.error('[AFK] Command error:', error);

      return message.reply({
        embeds: [
          errorEmbed({
            description: 'An unexpected error occurred while updating your AFK status.',
          }),
        ],
      });
    }
  },
};
