
const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    console.error('[Command Handler] Commands folder not found:', commandsPath);
    return;
  }

  const categoryFolders = fs.readdirSync(commandsPath);
  const loadedCommands = new Set();
  const registeredNames = new Map();

  let count = 0;
  let failed = 0;

  for (const folder of categoryFolders) {
    const folderPath = path.join(commandsPath, folder);

    let isDirectory = false;

    try {
      isDirectory = fs.statSync(folderPath).isDirectory();
    } catch (error) {
      console.error(`[Command Handler] Cannot access ${folder}:`, error.message);
      failed++;
      continue;
    }

    if (!isDirectory) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith('.js'))
      .sort();

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);

      try {
        const command = require(filePath);

        if (
          !command ||
          typeof command.name !== 'string' ||
          !command.name.trim() ||
          typeof command.execute !== 'function'
        ) {
          console.warn(
            `[Command Handler] Skipping invalid command: ${filePath}`
          );
          failed++;
          continue;
        }

        const commandName = command.name.trim().toLowerCase();

        if (registeredNames.has(commandName)) {
          console.warn(
            `[Command Handler] Duplicate command name "${commandName}" in ${filePath}.`
          );
          failed++;
          continue;
        }

        const aliases = Array.isArray(command.aliases)
          ? [...new Set(
              command.aliases
                .filter((alias) => typeof alias === 'string')
                .map((alias) => alias.trim().toLowerCase())
                .filter(Boolean)
            )]
          : [];

        const conflictingAlias = aliases.find(
          (alias) =>
            alias === commandName ||
            registeredNames.has(alias)
        );

        if (conflictingAlias) {
          console.warn(
            `[Command Handler] Alias "${conflictingAlias}" is already registered. Skipping ${filePath}.`
          );
          failed++;
          continue;
        }

        command.name = commandName;
        command.aliases = aliases;
        command.category = folder;

        client.commands.set(commandName, command);
        registeredNames.set(commandName, filePath);

        for (const alias of aliases) {
          client.commands.set(alias, command);
          registeredNames.set(alias, filePath);
        }

        loadedCommands.add(command);
        count++;
      } catch (error) {
        console.error(
          `[Command Handler] Failed to load ${filePath}:`,
          error
        );
        failed++;
      }
    }
  }

  console.log(`[Command Handler] Loaded ${count} commands.`);
  console.log(
    `[Command Handler] Registered ${client.commands.size} names including aliases.`
  );

  if (failed > 0) {
    console.warn(`[Command Handler] ${failed} command files skipped.`);
  }
}

module.exports = { loadCommands };
