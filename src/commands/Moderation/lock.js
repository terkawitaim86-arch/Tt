const { PermissionFlagsBits } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embedUtils');

module.exports = {
  name: 'lock',
  description: 'Lock the current channel (deny Send Messages for @everyone).',
  category: 'Moderation',
  usage: 'lock',
  aliases: [],
  async execute(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [errorEmbed({ description: 'You need the **Manage Channels** permission.' })] });
    }
    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      return message.reply({
        embeds: [successEmbed({ title: 'Channel Locked', description: `${message.channel} is now locked.` })],
      });
    } catch (error) {
      console.error('[lock]', error);
      return message.reply({ embeds: [errorEmbed({ description: 'Failed to lock this channel.' })] });
    }
  },
};
