const { PermissionFlagsBits } = require('discord.js');
const supabase = require('../../utils/db');
const { successEmbed, errorEmbed, usageEmbed, replyOptions } = require('../../utils/embedUtils');

module.exports = {
  name: 'setlevelreward',
  description: 'Set a role to be auto-assigned when a member reaches a level.',
  category: 'XP & Levels',
  usage: 'setlevelreward <level> <@role>',
  aliases: ['levelreward'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Missing permission',
            description: 'You need the **Manage Server** permission to use this command.',
          })
        )
      );
    }

    const level = parseInt(args[0], 10);
    const role = message.mentions.roles.first();

    if (!Number.isFinite(level) || level < 1 || level > 1000 || !role) {
      return message.reply(
        replyOptions(
          usageEmbed({
            command: 'setlevelreward',
            syntax: 'setlevelreward <level> <@role>',
            example: 'setlevelreward 10 @Active',
            description: 'Level must be between 1 and 1,000.',
          })
        )
      );
    }

    if (role.managed || role.id === message.guild.id) {
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Role not assignable',
            description: 'That role is managed by an integration and cannot be given as a reward.',
          })
        )
      );
    }

    const { error } = await supabase
      .from('level_rewards')
      .upsert({
        guild_id: message.guild.id,
        level,
        role_id: role.id,
      }, { onConflict: 'guild_id,level' });

    if (error) {
      console.error('[setlevelreward] Failed:', error.message);
      return message.reply(
        replyOptions(
          errorEmbed({
            title: 'Reward not saved',
            description: 'Failed to save the level reward. Please try again.',
          })
        )
      );
    }

    return message.reply(
      replyOptions(
        successEmbed({
          title: 'Level Reward Set',
          fields: [
            { name: 'Level', value: `${level}`, inline: true },
            { name: 'Role', value: `<@&${role.id}>`, inline: true },
          ],
          footer: 'ZMB • XP',
        })
      )
    );
  },
};
