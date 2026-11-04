const supabase = require('../utils/db');
const { getPrefix } = require('../utils/prefixManager');
const { COLORS } = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isButton()) return handleButton(interaction, client);
      if (interaction.isStringSelectMenu()) return handleSelectMenu(interaction, client);
    } catch (error) {
      console.error('[interactionCreate] Failed to handle interaction:', error);
      if (!interaction.replied && !interaction.deferred) interaction.reply({ content: 'Something went wrong while processing this interaction.', ephemeral: true }).catch(() => {});
    }
  },
};
async function handleButton(interaction, client) {
  if (interaction.customId === 'help_back') {
    const prefix = interaction.guild ? await getPrefix(interaction.guild.id) : ',';
    const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
    const config = require('../config');
    const embed = new EmbedBuilder().setColor(COLORS.primary).setTitle('ZMB').setDescription('A modular Discord moderation bot with prefix commands.\n' + `**Prefix:** \`${prefix}\`\n\nUse the dropdown menu below to browse commands by category.\n` + `Type \`${prefix}help <command>\` for detailed usage.`).addFields({ name: 'Categories', value: config.categories.map((c) => `**${c.name}** — ${c.description}`).join('\n'), inline: false }).setThumbnail(client.user.displayAvatarURL({ size: 256 })).setFooter({ text: 'ZMB • Select a category below' }).setTimestamp();
    const select = new StringSelectMenuBuilder().setCustomId('help_category').setPlaceholder('Select a category').addOptions(config.categories.map((cat) => ({ label: cat.name, description: cat.description.slice(0, 100), value: cat.name })));
    return interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
  }
  if (interaction.customId.startsWith('confirm_')) return;
  const { data, error } = await supabase.from('button_roles').select('role_id').eq('message_id', interaction.message.id).eq('label', interaction.customId).maybeSingle();
  if (error) return interaction.reply({ content: 'There was an error processing this button.', ephemeral: true }).catch(() => {});
  if (!data || !data.role_id) return interaction.reply({ content: 'This button is no longer configured.', ephemeral: true }).catch(() => {});
  const role = interaction.guild.roles.cache.get(data.role_id);
  if (!role) return interaction.reply({ content: 'The role linked to this button no longer exists.', ephemeral: true }).catch(() => {});
  const member = interaction.member;
  if (member.roles.cache.has(role.id)) { await member.roles.remove(role); return interaction.reply({ content: `Removed the **${role.name}** role from you.`, ephemeral: true }); }
  await member.roles.add(role);
  return interaction.reply({ content: `Gave you the **${role.name}** role.`, ephemeral: true });
}
async function handleSelectMenu(interaction, client) {
  if (interaction.customId !== 'help_category') return;
  const prefix = interaction.guild ? await getPrefix(interaction.guild.id) : ',';
  const helpCommand = client.commands.get('help');
  if (!helpCommand || !helpCommand.showCategoryEmbed) return;
  const embed = helpCommand.showCategoryEmbed(client, prefix, interaction.values[0], interaction.member);
  if (!embed) return;
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  return interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('help_back').setLabel('Back to Overview').setStyle(ButtonStyle.Secondary))] });
}
