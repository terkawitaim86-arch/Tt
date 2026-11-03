
const {
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const config = require('../../config');
const {
  saveTemplate,
  getTemplate,
  listTemplates,
  deleteTemplate
} = require('../../utils/embedStore');

function buildEmbed(data) {
  const color = /^#[0-9a-f]{6}$/i.test(data.color || '')
    ? parseInt(data.color.slice(1), 16)
    : config.embedColor || 0x5865F2;

  const embed = new EmbedBuilder().setColor(color);

  if (data.title) embed.setTitle(data.title);
  if (data.description) embed.setDescription(data.description);
  if (data.author) embed.setAuthor({ name: data.author });
  if (data.footer) embed.setFooter({ text: data.footer });
  if (data.thumbnail) embed.setThumbnail(data.thumbnail);
  if (data.image) embed.setImage(data.image);
  if (data.url) embed.setURL(data.url);
  if (data.timestamp) embed.setTimestamp();

  if (Array.isArray(data.fields)) {
    embed.addFields(data.fields.slice(0, 25));
  }

  return embed;
}

function controlPanel(data) {
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('ZMB • Embed Studio')
    .setDescription(
      '**Create professional Discord embeds.**\n\n' +
      `**Title:** ${data.title || 'Not set'}\n` +
      `**Description:** ${data.description ? 'Added' : 'Not set'}\n` +
      `**Colour:** ${data.color || '#5865F2'}\n` +
      `**Image:** ${data.image ? 'Added' : 'Not set'}\n` +
      `**Footer:** ${data.footer || 'Not set'}\n\n` +
      'Use the controls below to edit, preview, send or save your design.'
    )
    .setFooter({ text: 'ZMB OFFICIAL • Embed Builder' })
    .setTimestamp();
}

function buttons(id) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`zmb_edit_${id}`)
        .setLabel('Edit Embed')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`zmb_preview_${id}`)
        .setLabel('Preview')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`zmb_send_${id}`)
        .setLabel('Send')
        .setEmoji('📨')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`zmb_save_${id}`)
        .setLabel('Save')
        .setEmoji('💾')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function editModal(id, data) {
  const modal = new ModalBuilder()
    .setCustomId(`zmb_modal_${id}`)
    .setTitle('ZMB Embed Editor');

  const inputs = [
    ['title', 'Title', data.title, false, 256],
    ['description', 'Description', data.description, true, 4000],
    ['color', 'Colour (#5865F2)', data.color, false, 7],
    ['footer', 'Footer', data.footer, false, 2048],
    ['image', 'Image URL', data.image, false, 1000]
  ];

  modal.addComponents(
    ...inputs.map(([id, label, value, paragraph, max]) =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(id)
          .setLabel(label)
          .setStyle(
            paragraph
              ? TextInputStyle.Paragraph
              : TextInputStyle.Short
          )
          .setRequired(false)
          .setMaxLength(max)
          .setValue((value || '').slice(0, max))
      )
    )
  );

  return modal;
}

module.exports = {
  name: 'embed',
  description: 'Create and manage custom Discord embeds.',
  category: 'Embed Builder',
  usage: 'embed [create|send|save|load|list|delete]',
  aliases: ['embedbuilder'],

  async execute(message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(
      PermissionFlagsBits.ManageMessages
    )) {
      return message.reply('You need **Manage Messages** permission.');
    }

    const sub = args[0]?.toLowerCase();

    // INTERACTIVE BUILDER
    if (!sub || sub === 'create') {
      const data = {
        title: '',
        description: '',
        color: '#5865F2',
        footer: '',
        image: ''
      };

      const panel = await message.channel.send({
        embeds: [controlPanel(data)],
        components: buttons(message.id)
      });

      const collector = panel.createMessageComponentCollector({
        time: 5 * 60 * 1000,
        filter: i => i.user.id === message.author.id
      });

      collector.on('collect', async interaction => {
        try {
          const action = interaction.customId;

          if (action === `zmb_edit_${message.id}`) {
            await interaction.showModal(editModal(message.id, data));

            const submitted = await interaction.awaitModalSubmit({
              time: 120000,
              filter: i =>
                i.user.id === message.author.id &&
                i.customId === `zmb_modal_${message.id}`
            }).catch(() => null);

            if (!submitted) return;

            const color = submitted.fields.getTextInputValue('color').trim();
            const image = submitted.fields.getTextInputValue('image').trim();

            if (color && !/^#[0-9a-f]{6}$/i.test(color)) {
              return submitted.reply({
                content: 'Invalid colour. Example: `#5865F2`',
                ephemeral: true
              });
            }

            if (image && !/^https?:\/\//i.test(image)) {
              return submitted.reply({
                content: 'Image URL must start with http:// or https://',
                ephemeral: true
              });
            }

            data.title = submitted.fields.getTextInputValue('title').trim();
            data.description = submitted.fields.getTextInputValue('description').trim();
            data.color = color || '#5865F2';
            data.footer = submitted.fields.getTextInputValue('footer').trim();
            data.image = image;

            await submitted.deferUpdate();

            await panel.edit({
              embeds: [controlPanel(data)],
              components: buttons(message.id)
            });
          }

          else if (action === `zmb_preview_${message.id}`) {
            if (!data.title && !data.description) {
              return interaction.reply({
                content: 'Add a title or description first.',
                ephemeral: true
              });
            }

            await interaction.reply({
              embeds: [buildEmbed(data)],
              ephemeral: true
            });
          }

          else if (action === `zmb_send_${message.id}`) {
            if (!data.title && !data.description) {
              return interaction.reply({
                content: 'Add a title or description first.',
                ephemeral: true
              });
            }

            await interaction.channel.send({
              embeds: [buildEmbed(data)]
            });

            await interaction.reply({
              content: 'Embed sent successfully!',
              ephemeral: true
            });

            collector.stop();
          }

          else if (action === `zmb_save_${message.id}`) {
            const modal = new ModalBuilder()
              .setCustomId(`zmb_save_modal_${message.id}`)
              .setTitle('Save Template');

            modal.addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('name')
                  .setLabel('Template name')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMaxLength(40)
              )
            );

            await interaction.showModal(modal);

            const submitted = await interaction.awaitModalSubmit({
              time: 120000,
              filter: i =>
                i.user.id === message.author.id &&
                i.customId === `zmb_save_modal_${message.id}`
            }).catch(() => null);

            if (!submitted) return;

            const name = submitted.fields
              .getTextInputValue('name')
              .trim()
              .toLowerCase();

            if (!/^[a-z0-9_-]{1,40}$/.test(name)) {
              return submitted.reply({
                content: 'Use letters, numbers, underscores or hyphens only.',
                ephemeral: true
              });
            }

            const success = await saveTemplate(
              message.guild.id,
              name,
              data
            );

            await submitted.reply({
              content: success
                ? `Template **${name}** saved!`
                : 'Could not save template. Check the database.',
              ephemeral: true
            });
          }
        } catch (error) {
          console.error('[ZMB Embed Builder]', error);

          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'Something went wrong. Check the bot console.',
              ephemeral: true
            }).catch(() => {});
          }
        }
      });

      collector.on('end', () => {
        panel.edit({ components: [] }).catch(() => {});
      });

      return;
    }

    // SEND JSON
    if (sub === 'send') {
      try {
        const data = JSON.parse(args.slice(1).join(' '));
        return message.channel.send({
          embeds: [buildEmbed(data)]
        });
      } catch (error) {
        return message.reply('Invalid JSON or embed data.');
      }
    }

    // SAVE TEMPLATE
    if (sub === 'save') {
      const name = args[1]?.toLowerCase();

      if (!name) {
        return message.reply('Usage: `,embed save <name> {json}`');
      }

      try {
        const data = JSON.parse(args.slice(2).join(' '));
        const success = await saveTemplate(message.guild.id, name, data);

        return message.reply(
          success ? `Template **${name}** saved!` : 'Failed to save template.'
        );
      } catch {
        return message.reply('Invalid JSON.');
      }
    }

    // LOAD TEMPLATE
    if (sub === 'load') {
      const name = args[1]?.toLowerCase();
      if (!name) return message.reply('Usage: `,embed load <name>`');

      const data = await getTemplate(message.guild.id, name);
      if (!data) return message.reply(`Template **${name}** not found.`);

      return message.channel.send({
        embeds: [buildEmbed(data)]
      });
    }

    // LIST TEMPLATES
    if (sub === 'list') {
      const templates = await listTemplates(message.guild.id);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('ZMB • Saved Templates')
        .setDescription(
          templates.length
            ? templates.map(name => `• \`${name}\``).join('\n')
            : 'No templates saved yet.'
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // DELETE TEMPLATE
    if (sub === 'delete') {
      const name = args[1]?.toLowerCase();
      if (!name) return message.reply('Usage: `,embed delete <name>`');

      const success = await deleteTemplate(message.guild.id, name);

      return message.reply(
        success
          ? `Template **${name}** deleted.`
          : `Template **${name}** not found.`
      );
    }

    return message.reply(
      '**ZMB Embed Builder**\n\n' +
      '`,embed` — Open interactive builder\n' +
      '`,embed create` — Create an embed\n' +
      '`,embed list` — View saved templates\n' +
      '`,embed load <name>` — Send a saved template\n' +
      '`,embed delete <name>` — Delete a template\n' +
      '`,embed send {json}` — Send JSON embed\n' +
      '`,embed save <name> {json}` — Save JSON template'
    );
  }
};
