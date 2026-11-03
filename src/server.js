const express = require('express');
const {
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');

function startWebServer(client) {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  // API status
  app.get('/', (req, res) => {
    res.json({
      name: 'ZMB Embed Studio',
      status: 'Online'
    });
  });

  // Get available Discord servers
  app.get('/api/guilds', (req, res) => {
    try {
      const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name
      }));

      res.json(guilds);
    } catch (error) {
      console.error('[ZMB Web] Guild error:', error);
      res.status(500).json({
        error: 'Could not load servers.'
      });
    }
  });

  // Get text channels
  app.get('/api/channels/:guildId', (req, res) => {
    try {
      const guild = client.guilds.cache.get(req.params.guildId);

      if (!guild) {
        return res.status(404).json({
          error: 'Server not found.'
        });
      }

      const channels = guild.channels.cache
        .filter(channel =>
          channel.type === ChannelType.GuildText &&
          channel.permissionsFor(client.user)?.has(
            PermissionFlagsBits.SendMessages
          )
        )
        .map(channel => ({
          id: channel.id,
          name: channel.name
        }));

      res.json(channels);

    } catch (error) {
      console.error('[ZMB Web] Channel error:', error);

      res.status(500).json({
        error: 'Could not load channels.'
      });
    }
  });

  // Embed sending (disabled until authentication is implemented)
  app.post('/api/embed/send', (req, res) => {
    res.status(501).json({
      error: 'Authentication is required before sending embeds.'
    });
  });

  const PORT = process.env.WEB_PORT || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZMB Web] Running on port ${PORT}`);
  });
}

module.exports = { startWebServer };