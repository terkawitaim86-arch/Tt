const {
Client,
GatewayIntentBits,
Partials,
Collection
} = require(‘discord.js’);

const { loadCommands } = require(’./handlers/commandHandler’);
const { loadEvents } = require(’./handlers/eventHandler’);
const { startWebServer } = require(’./server’);

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMessageReactions,
GatewayIntentBits.GuildBans,
],

partials: [
Partials.Channel,
Partials.Reaction,
Partials.Message,
Partials.GuildMember,
],
});

global.client = client;

client.commands = new Collection();

// Initialize commands and events
function initializeBot() {
loadCommands(client);

console.log(
[ZMB] Loaded ${client.commands.size} command names and aliases.
);

loadEvents(client);

console.log(’[ZMB] Event handlers loaded.’);
}

// Discord error handling
client.on(‘error’, (error) => {
console.error(’[Discord Client Error]’, error);
});

client.on(‘shardError’, (error, shardId) => {
console.error([Discord Shard ${shardId} Error], error);
});

// Start bot
async function startBot() {
const token = process.env.DISCORD_TOKEN;

if (!token) {
throw new Error(
‘Missing DISCORD_TOKEN environment variable. Check your hosting panel.’
);
}

try {
initializeBot();

await client.login(token);
console.log('[ZMB] Discord bot connected.');
startWebServer(client);
console.log('[ZMB] Embed Studio API initialized.');
return client;

} catch (error) {
console.error(’[ZMB] Startup failed:’, error);

throw error;

}
}

// Stop bot
async function stopBot() {
client.destroy();

console.log(’[ZMB] Bot disconnected.’);
}

module.exports = {
startBot,
stopBot,
client
};