const express = require('express');
const {
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

function startWebServer(client) {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  app.get('/', (req, res) => {
    res.send('ZMB Embed Studio API is online.');
  });

  app.get('/api/guilds', async (req, res) => {
    try {
      const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name
      }));

      res.json(guilds);
    } catch {
      res.status(500).json({ error: 'Could not load servers.' });
    }
  });

  app.get('/api/channels/:guildId', async (req, res) => {
    try {
      const guild = client.guilds.cache.get(req.params.guildId);

      if (!guild) {
        return res.status(404).json({ error: 'Server not found.' });
      }

      const channels = guild.channels.cache
        .filter(channel =>
          channel.type === 0 &&
          channel.permissionsFor(client.user)?.has(
            PermissionFlagsBits.SendMessages
          )
        )
        .map(channel => ({
          id: channel.id,
          name: channel.name
        }));

      res.json(channels);
    } catch {
      res.status(500).json({ error: 'Could not load channels.' });
    }
  });

  app.post('/api/embed/send', async (req, res) => {
    return res.status(501).json({
      error: 'Authentication must be configured before sending embeds.'
    });
  });

  const port = process.env.WEB_PORT || 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ZMB Web] API listening on port ${port}`);
  });
}

module.exports = { startWebServer };