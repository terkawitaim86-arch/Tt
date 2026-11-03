const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { errorEmbed, usageEmbed, successEmbed } = require('../../utils/embedUtils');
const { getPrefix } = require('../../utils/prefixManager');

module.exports = {
  name: 'buttonrole',
  description: 'Create a button role panel.',
  category: 'Reaction Roles',
  usage: 'buttonrole <title> | <label1> <@role1> | <label2> <@role2> ...',
  aliases: ['br'],
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply({ embeds: [errorEmbed({ description: 'You need the **Manage Roles** permission.' })] });
    }
    const parts = args.join(' ').split('|').map((p) => p.trim());
    if (parts.length < 2) {
      const prefix = await getPrefix(message.guild.id);
      return message.reply({
        embeds: [
          usageEmbed({
            command: 'buttonrole',
            syntax: `${prefix}buttonrole <title> | <label> <@role> | ...`,
          }),
        ],
      });
    }
    const title = parts[0];
    const pairs = [];
    for (const part of parts.slice(1)) {
      const m = part.match(/^(.+?)\s+<@&?(\d+)>$/);
      if (!m) continue;
      const label = m[1].trim().slice(0, 80);
      const role = message.guild.roles.cache.get(m[2]);
      if (role) pairs.push({ label, role });
    }
    if (!pairs.length) {
      return message.reply({ embeds: [errorEmbed({ description: 'No valid label/role pairs found.' })] });
    }
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(title)
      .setDescription(pairs.map((p) => `**${p.label}** â <@&${p.role.id}>`).join('\n'))
      .setFooter({ text: 'ZMB OFFICIAL â¢ Button Roles' })
      .setTimestamp();

    const rows = [];
    for (let i = 0; i < pairs.length; i += 5) {
      const chunk = pairs.slice(i, i + 5);
      const row = new ActionRowBuilder();
      for (const p of chunk) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`br:${p.role.id}`)
            .setLabel(p.label)
            .setStyle(ButtonStyle.Primary)
        );
      }
      rows.push(row);
    }
    await message.channel.send({ embeds: [embed], components: rows.slice(0, 5) });
    if (message.deletable) message.delete().catch(() => {});
  },
};
