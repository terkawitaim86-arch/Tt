const { infoEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');
const { parseDuration, createReminder, getUserReminders } = require('../../utils/reminderManager');

module.exports = {
  name: 'remind',
  description: 'Set a reminder. The bot will ping you when the time is up.',
  category: 'Utility',
  usage: 'remind <duration> <message>',
  aliases: ['reminder'],
  async execute(message, args, client) {
    const durationInput = args[0];
    const text = args.slice(1).join(' ');

    if (!durationInput || !text) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'remind',
            syntax: 'remind <duration> <message>',
            example: 'remind 10m Check the server logs',
            description: 'Durations accept `s`, `m`, `h`, `d` (e.g. `10m`, `2h`).\nUse `remind list` to see your active reminders.',
          })
        )
      );
    }

    if (durationInput.toLowerCase() === 'list') {
      const reminders = await getUserReminders(message.guild.id, message.author.id);

      if (!reminders || reminders.length === 0) {
        return message.reply(
          replyOptions(
            infoEmbed({
              title: 'Your Reminders',
              description: 'You have no active reminders.',
              footer: 'ZMB • Reminders',
            })
          )
        );
      }

      const embed = infoEmbed({
        title: 'Your Reminders',
        description: `You have **${reminders.length}** active reminder${reminders.length === 1 ? '' : 's'}.`,
        fields: reminders.slice(0, 25).map((r) => ({
          name: `<t:${Math.floor(new Date(r.due_at).getTime() / 1000)}:R>`,
          value: (r.message || 'Reminder').slice(0, 1024),
          inline: false,
        })),
        footer: 'ZMB • Reminders',
      });

      return message.reply(replyOptions(embed));
    }

    const parsed = parseDuration(durationInput);
    if (!parsed) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Invalid duration',
            description: `\`${durationInput}\` is not a valid duration. Use formats like \`10m\`, \`2h\`, \`1d\`.`,
          })
        )
      );
    }

    const dueAt = new Date(Date.now() + parsed.seconds * 1000);
    const id = await createReminder({
      guildId: message.guild.id,
      channelId: message.channel.id,
      userId: message.author.id,
      message: text,
      dueAt,
    });

    if (!id) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Reminder not saved',
            description: 'Failed to set the reminder. Please try again in a moment.',
          })
        )
      );
    }

    const embed = infoEmbed({
      title: 'Reminder Set',
      fields: [
        { name: 'When', value: `<t:${Math.floor(dueAt.getTime() / 1000)}:R>`, inline: true },
        { name: 'Reminder', value: text.slice(0, 1024), inline: false },
      ],
      footer: 'ZMB • Reminders',
    });

    return message.reply(replyOptions(embed));
  },
};
