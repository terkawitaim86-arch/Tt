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
    GatewayIntentBits.GuildModeration,
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
  const { getDueReminders, markReminderComplete } = require('./utils/reminderManager');
  const interval = setInterval(async () => {
    try {
      const due = await getDueReminders();
      for (const reminder of due) {
        const channel = client.channels.cache.get(reminder.channel_id);
        if (channel) {
          const { EmbedBuilder } = require('discord.js');
          const config = require('./config');
          const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('Reminder')
            .setDescription(`<@${reminder.user_id}>, you asked me to remind you:\n\n**${reminder.message}**`)
            .setTimestamp();
          channel.send({ content: `<@${reminder.user_id}>`, embeds: [embed] }).catch(() => {});
        }
        await markReminderComplete(reminder.id);
      }
    } catch (e) {
      // Silently ignore — don't crash the bot
    }
  }, 30000);

  client._reminderInterval = interval;
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
