
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
} = require('discord.js');

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
  partials: [
    Partials.Channel,
    Partials.Reaction,
    Partials.Message,
    Partials.GuildMember,
  ],
});

global.client = client;
client.commands = new Collection();

loadCommands(client);
console.log('[ZMB] Commands loaded:', client.commands.size);

loadEvents(client);
console.log('[ZMB] Event loader finished');

// Discord client error logging
client.on('error', (error) => {
  console.error('[Discord Client Error]', error);
});

client.on('shardError', (error, shardId) => {
  console.error(`[Shard Error] Shard ${shardId}:`, error);
});

client.on('shardDisconnect', (event, shardId) => {
  console.warn(
    `[Shard Disconnect] Shard ${shardId} disconnected. Code: ${event.code}`
  );
});

client.on('shardReconnecting', (shardId) => {
  console.log(`[Shard Reconnecting] Shard ${shardId} is reconnecting.`);
});

client.on('shardResume', (shardId, replayedEvents) => {
  console.log(
    `[Shard Resume] Shard ${shardId} resumed. Replayed ${replayedEvents} events.`
  );
});

// Reminder system
let reminderInterval = null;
let reminderCheckRunning = false;

async function processReminders() {
  if (reminderCheckRunning) return;

  reminderCheckRunning = true;

  try {
    const {
      getDueReminders,
      markReminderComplete,
    } = require('./utils/reminderManager');

    const config = require('./config');
    const reminders = await getDueReminders();

    if (!Array.isArray(reminders) || reminders.length === 0) {
      return;
    }

    for (const reminder of reminders) {
      try {
        const channel = await client.channels.fetch(
          reminder.channel_id
        ).catch(() => null);

        if (!channel || !channel.isTextBased() || !channel.send) {
          console.warn(
            `[Reminders] Could not access channel for reminder ${reminder.id}.`
          );
          continue;
        }

        const embed = new EmbedBuilder()
          .setColor(config.embedColor || 0x5865F2)
          .setTitle('Reminder')
          .setDescription(
            `<@${reminder.user_id}>, you asked me to remind you:\n\n**${reminder.message}**`
          )
          .setTimestamp();

        await channel.send({
          content: `<@${reminder.user_id}>`,
          embeds: [embed],
          allowedMentions: {
            users: [reminder.user_id],
          },
        });

        await markReminderComplete(reminder.id);

        console.log(
          `[Reminders] Successfully delivered reminder ${reminder.id}.`
        );
      } catch (error) {
        console.error(
          `[Reminders] Failed to process reminder ${reminder.id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error('[Reminders] Reminder check failed:', error);
  } finally {
    reminderCheckRunning = false;
  }
}

client.once('clientReady', () => {
  console.log(`[ZMB] Logged in as ${client.user.tag}`);

  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  processReminders();

  reminderInterval = setInterval(() => {
    processReminders();
  }, 30000);
});

async function startBot() {
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    console.error(
      '[ZMB] Missing DISCORD_TOKEN. Add your bot token to the environment variables.'
    );
    process.exit(1);
  }

  try {
    await client.login(token);
  } catch (error) {
    console.error('[ZMB] Failed to log in:', error);
    throw error;
  }
}

module.exports = { startBot };
