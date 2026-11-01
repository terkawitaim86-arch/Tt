const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');

module.exports = {
  name: 'clear',
  description: 'Delete a number of recent messages from the channel.',
  category: 'Moderation',
  usage: 'clear <amount> [@member]',
  aliases: ['purge', 'c'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('You need the **Manage Messages** permission to use this command.');
    }

    const amount = parseInt(args[0], 10);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply('You must specify a number between **1 and 100**.');
    }

    const targetMember = message.mentions.members.first() || null;

    try {
      let messages = await message.channel.messages.fetch({ limit: amount + 1 });

      if (targetMember) {
        messages = messages.filter((m) => m.author.id === targetMember.id);
      }

      const toDelete = Array.from(messages.values()).slice(0, amount + (targetMember ? 0 : 1));

      if (toDelete.length === 0) {
        return message.reply('No messages found to delete.');
      }

      const deleted = await message.channel.bulkDelete(toDelete, true);

      if (targetMember) {
        await logAction({
          guildId: message.guild.id,
          action: 'clear',
          targetId: targetMember.id,
          moderatorId: message.author.id,
          reason: `Cleared ${deleted.size} messages from ${targetMember.user.tag}`,
        });
      } else {
        await logAction({
          guildId: message.guild.id,
          action: 'clear',
          targetId: 'channel',
          moderatorId: message.author.id,
          reason: `Cleared ${deleted.size} messages in #${message.channel.name}`,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🧹 Messages Cleared')
        .addFields(
          { name: 'Deleted', value: `${deleted.size} messages`, inline: true },
          { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true }
        )
        .setTimestamp();

      if (targetMember) {
        embed.addFields({ name: 'Filtered by', value: `<@${targetMember.id}>`, inline: true });
      }

      const reply = await message.channel.send({ embeds: [embed] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);

      return;
    } catch (error) {
      console.error('[clear] Failed:', error);

      if (error.code === 50034) {
        return message.reply('I can only bulk delete messages from the **last 14 days**. Older messages must be deleted individually.');
      }

      return message.reply('Failed to delete messages. Please try again.');
    }
  },
};
