const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'antispam',
  description: 'Removed: anti-spam protection has been disabled for this bot.',
  category: 'Security',
  usage: 'antispam',
  aliases: ['spamconfig'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const settings = await getSettings(message.guild.id);
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Anti-Spam Removed')
      .setDescription('Anti-spam protection has been disabled for ZMB and is no longer enforced.')
      .addFields(
        { name: 'Status', value: 'Disabled', inline: true },
        { name: 'Configuration', value: 'No longer used', inline: true },
        { name: 'Note', value: 'This command is kept only as a compatibility stub.', inline: false }
      )
      .setFooter({ text: `${config.botName} • Deprecated feature` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
