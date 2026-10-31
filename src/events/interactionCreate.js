const supabase = require('../utils/db');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    try {
      const { data, error } = await supabase
        .from('button_roles')
        .select('role_id')
        .eq('message_id', interaction.message.id)
        .eq('label', interaction.customId)
        .maybeSingle();

      if (error) {
        console.error('[interactionCreate] Supabase error:', error.message);
        return interaction.reply({ content: 'There was an error processing this button.', ephemeral: true }).catch(() => {});
      }

      if (!data || !data.role_id) {
        return interaction.reply({ content: 'This button is no longer configured.', ephemeral: true }).catch(() => {});
      }

      const role = interaction.guild.roles.cache.get(data.role_id);
      if (!role) {
        return interaction.reply({ content: 'The role linked to this button no longer exists.', ephemeral: true }).catch(() => {});
      }

      const member = interaction.member;
      const hasRole = member.roles.cache.has(role.id);

      if (hasRole) {
        await member.roles.remove(role);
        return interaction.reply({ content: `Removed the **${role.name}** role from you.`, ephemeral: true });
      }

      await member.roles.add(role);
      return interaction.reply({ content: `Gave you the **${role.name}** role.`, ephemeral: true });
    } catch (error) {
      console.error('[interactionCreate] Failed to handle button interaction:', error);
      if (!interaction.replied && !interaction.deferred) {
        interaction.reply({ content: 'Something went wrong while processing this button.', ephemeral: true }).catch(() => {});
      }
    }
  },
};
