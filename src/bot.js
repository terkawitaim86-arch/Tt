const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

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
client.commands = new Collection();

function initializeBot() {
  loadCommands(client);
  console.log(`[ZMB] Loaded ${client.commands.size} command names and aliases.`);

  loadEvents(client);
  console.log('[ZMB] Event handlers loaded.');
}

client.on('error', (error) => {
  console.error('[Discord Client Error]', error.message);
});

client.on('shardError', (error, shardId) => {
  console.error(`[Discord Shard ${shardId} Error]`, error.message);
});

async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error('Missing DISCORD_TOKEN environment variable. Configure it in the hosting panel.');
  }

  initializeBot();
  await client.login(token);
  return client;
}

async function stopBot() {
  if (client) {
    client.destroy();
  }
}

module.exports = { startBot, stopBot, client };
