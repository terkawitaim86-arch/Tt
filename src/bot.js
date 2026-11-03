
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { startWebServer } = require('./web/server');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildBans,
  ],
  partials: [Partials.Channel, Partials.Reaction, Partials.Message, Partials.GuildMember],
});

global.client = client;
startWebServer(client);

client.commands = new Collection();
loadCommands(client);
console.log('COMMANDS LOADED:', client.commands.size);

loadEvents(client);
console.log('EVENTS LOADER FINISHED');
