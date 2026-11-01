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
loadCommands(client);
console.log('COMMANDS LOADED:', client.commands.size);

loadEvents(client);
console.log('EVENTS LOADER FINISHED');


// Client-level error and disconnect logging
client.on('error', (err) => {
  console.error('[Discord Client Error]', err.message);
  if (err.stack) console.error('  Stack:', err.stack);
});

client.on('shardError', (err, shardId) => {
  console.error(`[Shard Error] Shard ${shardId}:`, err.message);
});

client.on('shardDisconnect', (event, shardId) => {
  console.warn(`[Shard Disconnect] Shard ${shardId} disconnected. Code: ${event.code}, Reason: ${event.reason}`);
});

client.on('shardReconnecting', (shardId) => {
  console.log(`[Shard Reconnecting] Shard ${shardId} is reconnecting...`);
});

client.on('shardResume', (shardId, replayedEvents) => {
  console.log(`[Shard Resume] Shard ${shardId} resumed. Replayed ${replayedEvents} events.`);
});

client.on('clientReady', () => {
  const { processDueReminders } = require('./utils/reminderRunner');
  const REMINDER_INTERVAL_MS = 30000;

  let running = false;

  const interval = setInterval(async () => {
    // Overlapping ticks could deliver the same reminder twice; skip instead of queueing.
    if (running) {
      console.warn('[Reminders] Previous tick is still running — skipping this one.');
      return;
    }

    running = true;
    try {
      await processDueReminders(client);
    } catch (error) {
      console.error('[Reminders] Tick failed unexpectedly:', error && (error.message || error));
    } finally {
      running = false;
    }
  }, REMINDER_INTERVAL_MS);

  client._reminderInterval = interval;
  console.log(`[Reminders] Reminder loop started (every ${REMINDER_INTERVAL_MS / 1000}s).`);
});

async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('Missing DISCORD_TOKEN — add your bot token to the .env file.');
    process.exit(1);
  }
  await client.login(token);
}

module.exports = { startBot };
