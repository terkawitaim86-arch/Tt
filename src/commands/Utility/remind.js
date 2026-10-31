const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
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
      return message.reply('Usage: `remind <duration> <message>`\nDurations: s, m, h, d (e.g. `10m`, `2h`)\nUse `remind list` to see your active reminders.');
    }

    if (durationInput.toLowerCase() === 'list') {
      const reminders = await getUserReminders(message.guild.id, message.author.id);
      if (reminders.length === 0) {
        return message.reply('You have no active reminders.');
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('Your Reminders')
        .addFields(
          reminders.map((r) => ({
            name: `⏰ <t:${Math.floor(new Date(r.due_at).getTime() / 1000)}:R>`,
            value: r.message,
            inline: false,
          }))
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const parsed = parseDuration(durationInput);
    if (!parsed) {
      return message.reply(`Invalid duration \`${durationInput}\`. Use formats like \`10m\`, \`2h\`, \`1d\`.`);
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
      return message.reply('Failed to set the reminder. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Reminder Set')
      .addFields(
        { name: 'When', value: `<t:${Math.floor(dueAt.getTime() / 1000)}:R>`, inline: true },
        { name: 'Reminder', value: text, inline: false }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
