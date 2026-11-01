const config = require('../../config');
const { getPrefix } = require('../../utils/prefixManager');
const { parseDuration, createReminder, getUserReminders } = require('../../utils/reminderManager');
const {
  infoEmbed,
  successEmbed,
  usageErrorEmbed,
  logCommandError,
  createBaseEmbed,
  COLORS,
} = require('../../utils/embedUtils');

const command = {
  name: 'remind',
  description: 'Set a reminder. The bot will ping you when the time is up.',
  category: 'Utility',
  usage: 'remind <duration> <message>',
  aliases: ['reminder'],
  async execute(message, args, client) {
    const prefix = message.guild ? await getPrefix(message.guild.id) : config.defaultPrefix;
    const fail = (problem, title) =>
      message.reply({ embeds: [usageErrorEmbed(command, prefix, problem, { title })] });

    const durationInput = args[0];
    const text = args.slice(1).join(' ');

    if (durationInput && durationInput.toLowerCase() === 'list') {
      const reminders = await getUserReminders(message.guild.id, message.author.id);

      if (reminders.length === 0) {
        return message.reply({
          embeds: [
            infoEmbed({
              title: 'No active reminders',
              description: `You have no reminders in this server. Create one with \`${prefix}remind 10m stretch\`.`,
              footerContext: 'Reminders',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          infoEmbed({
            title: 'Your reminders',
            description: `${reminders.length} active reminder${reminders.length === 1 ? '' : 's'} in this server.`,
            fields: reminders.map((reminder) => ({
              name: `Due <t:${Math.floor(new Date(reminder.due_at).getTime() / 1000)}:R>`,
              value: reminder.message.slice(0, 1024),
              inline: false,
            })),
            footerContext: 'Reminders',
          }),
        ],
      });
    }

    if (!durationInput || !text) {
      return fail('Provide a duration and the reminder text.', 'Missing details');
    }

    const parsed = parseDuration(durationInput);
    if (!parsed) {
      return fail('Use a duration like `10m`, `2h` or `1d`.', 'Invalid duration');
    }

    const dueAt = new Date(Date.now() + parsed.seconds * 1000);

    try {
      const id = await createReminder({
        guildId: message.guild.id,
        channelId: message.channel.id,
        userId: message.author.id,
        message: text,
        dueAt,
      });

      if (!id) {
        return message.reply({
          embeds: [
            createBaseEmbed({
              title: 'Reminder not saved',
              description: 'The reminder could not be stored. Please try again.',
              color: COLORS.error,
              footerContext: 'Reminders',
            }),
          ],
        });
      }

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Reminder set',
            description: `I will remind you <t:${Math.floor(dueAt.getTime() / 1000)}:R> in <#${message.channel.id}>.`,
            fields: [{ name: 'Reminder', value: text.slice(0, 1024), inline: false }],
            footerContext: 'Reminders',
          }),
        ],
      });
    } catch (error) {
      logCommandError('remind', error);
      return message.reply({
        embeds: [
          createBaseEmbed({
            title: 'Reminder not saved',
            description: 'The reminder could not be stored. Please try again.',
            color: COLORS.error,
            footerContext: 'Reminders',
          }),
        ],
      });
    }
  },
};

module.exports = command;
