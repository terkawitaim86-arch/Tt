const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { addReactionRole } = require('../../utils/roleManager');

module.exports = {
  name: 'reactionrole',
  description: 'Create a reaction role message. Members react to get a role.',
  category: 'Reaction Roles',
  usage: 'reactionrole <title> | <emoji1> <@role1> | <emoji2> <@role2> ...',
  aliases: ['rr'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply('You need the **Manage Roles** permission to use this command.');
    }

    const fullText = args.join(' ');
    const parts = fullText.split('|').map((p) => p.trim());

    if (parts.length < 3) {
      return message.reply('Usage: `reactionrole <title> | <emoji1> <@role1> | <emoji2> <@role2> ...`');
    }

    const title = parts[0];
    const rolePairs = parts.slice(1);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(title)
      .setDescription('React below to get your role!')
      .setFooter({ text: `${config.botName} • Reaction Roles` })
      .setTimestamp();

    const validPairs = [];

    for (const pair of rolePairs) {
      const match = pair.match(/^(\S+)\s+<@&(\d+)>$/);
      if (!match) {
        return message.reply(`Invalid format: \`${pair}\`. Use \`<emoji> <@role>\`.`);
      }

      const emoji = match[1];
      const roleId = match[2];
      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        return message.reply(`Role not found for \`${pair}\`.`);
      }

      embed.addFields({ name: emoji, value: `<@&${roleId}>`, inline: true });
      validPairs.push({ emoji, roleId });
    }

    const sentMessage = await message.channel.send({ embeds: [embed] });

    for (const pair of validPairs) {
      await addReactionRole({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: sentMessage.id,
        emoji: pair.emoji,
        roleId: pair.roleId,
      });
      await sentMessage.react(pair.emoji).catch(() => {});
    }

    const confirm = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`Reaction role message created! [Click here](${sentMessage.url})`);

    return message.reply({ embeds: [confirm] });
  },
};
