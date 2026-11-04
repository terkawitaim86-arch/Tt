const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
module.exports = { name: 'avatar', description: "Shows a member's avatar.", category: 'General', usage: 'avatar [@user]', aliases: ['av', 'pfp'], async execute(message) { const member = message.mentions.members.first() || message.member; return message.reply({ embeds: [new EmbedBuilder().setColor(config.embedColor).setTitle(`${member.user.tag}'s Avatar`).setImage(member.user.displayAvatarURL({ size: 512 })).setFooter({ text: config.botName }).setTimestamp()] }); } };
