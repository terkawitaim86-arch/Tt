const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const COLORS = {
  primary: 0x2B2D31,
  success: 0x2ECC71,
  error: 0xE74C3C,
  warning: 0xF1C40F,
  info: 0x3498DB,
  moderation: 0xE74C3C,
};

function baseEmbed(color) {
  return new EmbedBuilder()
    .setColor(color || COLORS.primary)
    .setFooter({ text: 'ZMB' })
    .setTimestamp();
}

function success(title, description) {
  const embed = baseEmbed(COLORS.success);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function error(title, description) {
  const embed = baseEmbed(COLORS.error);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function warning(title, description) {
  const embed = baseEmbed(COLORS.warning);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function info(title, description) {
  const embed = baseEmbed(COLORS.info);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function primary(title, description) {
  const embed = baseEmbed(COLORS.primary);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function modAction({ action, target, moderator, reason, fields }) {
  const embed = baseEmbed(COLORS.moderation);
  embed.setTitle(`${action}`);
  embed.addFields(
    { name: 'Target', value: target, inline: false },
    { name: 'Moderator', value: moderator, inline: false },
    { name: 'Reason', value: reason || 'No reason provided', inline: false },
  );
  if (fields && Array.isArray(fields)) {
    for (const f of fields) {
      embed.addFields({ name: f.name, value: f.value, inline: f.inline || false });
    }
  }
  return embed;
}

module.exports = { COLORS, baseEmbed, success, error, warning, info, primary, modAction };
