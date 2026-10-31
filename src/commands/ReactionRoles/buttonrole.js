const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { addButtonRole } = require('../../utils/roleManager');

module.exports = {
  name: 'buttonrole',
  description: 'Create a button role message. Members click a button to get a role.',
  category: 'Reaction Roles',
  usage: 'buttonrole <title> | <label1> <@role1> | <label2> <@role2> ...',
  aliases: ['br'],
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply('You need the **Manage Roles** permission to use this command.');
    }

    const fullText = args.join(' ');
    const parts = fullText.split('|').map((p) => p.trim());

    if (parts.length < 3) {
      return message.reply('Usage: `buttonrole <title> | <label1> <@role1> | <label2> <@role2> ...`');
    }

    const title = parts[0];
    const rolePairs = parts.slice(1);

    if (rolePairs.length > 25) {
      return message.reply('You can only have up to 25 buttons (5 rows of 5).');
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(title)
      .setDescription('Click a button below to get your role!')
      .setFooter({ text: `${config.botName} • Button Roles` })
      .setTimestamp();

    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonsInRow = 0;

    for (const pair of rolePairs) {
      const match = pair.match(/^(.+?)\s+<@&(\d+)>$/);
      if (!match) {
        return message.reply(`Invalid format: \`${pair}\`. Use \`<label> <@role>\`.`);
      }

      const label = match[1].trim();
      const roleId = match[2];
      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        return message.reply(`Role not found for \`${pair}\`.`);
      }

      const button = new ButtonBuilder()
        .setCustomId(label)
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary);

      currentRow.addComponents(button);
      buttonsInRow++;

      if (buttonsInRow === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonsInRow = 0;
      }

      embed.addFields({ name: label, value: `<@&${roleId}>`, inline: true });
    }

    if (buttonsInRow > 0) {
      rows.push(currentRow);
    }

    const sentMessage = await message.channel.send({ embeds: [embed], components: rows });

    for (const pair of rolePairs) {
      const match = pair.match(/^(.+?)\s+<@&(\d+)>$/);
      const label = match[1].trim();
      const roleId = match[2];

      await addButtonRole({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: sentMessage.id,
        label,
        style: 2,
        roleId,
      });
    }

    const confirm = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`Button role message created! [Click here](${sentMessage.url})`);

    return message.reply({ embeds: [confirm] });
  },
};
