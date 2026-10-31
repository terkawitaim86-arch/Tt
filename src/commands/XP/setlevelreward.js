const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getSettings, updateSettings } = require('../../utils/guildSettings');

module.exports = {
  name: 'setlevelreward',
  description: 'Set a role to be auto-assigned when a member reaches a level.',
  category: 'XP & Levels',
  usage: 'setlevelreward <level> <@role>',
  aliases: ['levelreward'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('You need the **Manage Server** permission to use this command.');
    }

    const level = parseInt(args[0], 10);
    const role = message.mentions.roles.first();

    if (!level || level < 1 || !role) {
      return message.reply('Usage: `setlevelreward <level> <@role>`');
    }

    const supabase = require('../../utils/db');
    const { error } = await supabase
      .from('level_rewards')
      .upsert({
        guild_id: message.guild.id,
        level,
        role_id: role.id,
      }, { onConflict: 'guild_id,level' });

    if (error) {
      console.error('[setlevelreward] Failed:', error.message);
      return message.reply('Failed to save level reward. Please try again.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Level Reward Set')
      .addFields(
        { name: 'Level', value: `${level}`, inline: true },
        { name: 'Role', value: `<@&${role.id}>`, inline: true }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
