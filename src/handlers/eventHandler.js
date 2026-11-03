
const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');

  if (!fs.existsSync(eventsPath)) {
    console.error('[Event Handler] Events folder not found:', eventsPath);
    return;
  }

  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.js'));

  let loaded = 0;
  let failed = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);

    try {
      const event = require(filePath);

      if (
        !event ||
        typeof event.name !== 'string' ||
        typeof event.execute !== 'function'
      ) {
        console.warn(`[Event Handler] Skipping invalid event: ${file}`);
        failed++;
        continue;
      }

      const handler = (...args) => {
        try {
          const result = event.execute(...args, client);

          if (result && typeof result.catch === 'function') {
            result.catch((error) => {
              console.error(
                `[Event Handler] Error in ${event.name}:`,
                error
              );
            });
          }
        } catch (error) {
          console.error(
            `[Event Handler] Error in ${event.name}:`,
            error
          );
        }
      };

      if (event.once) {
        client.once(event.name, handler);
      } else {
        client.on(event.name, handler);
      }

      loaded++;
    } catch (error) {
      failed++;

      console.error(
        `[Event Handler] Failed to load ${file}:`,
        error
      );
    }
  }

  console.log(
    `[Event Handler] Loaded ${loaded}/${eventFiles.length} events.`
  );

  if (failed > 0) {
    console.warn(`[Event Handler] ${failed} event(s) failed to load.`);
  }
}

module.exports = { loadEvents };
