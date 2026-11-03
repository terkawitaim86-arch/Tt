const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`[Ready] ${client.user.tag} is online!`);
    client.user.setActivity(',help', { type: ActivityType.Listening });
  },
};
