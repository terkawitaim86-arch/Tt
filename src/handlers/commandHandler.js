const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categoryFolders = fs.readdirSync(commandsPath);

  let count = 0;

  for (const folder of categoryFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      if (!command.name || !command.execute) {
        console.warn(`[Command Handler] Skipping invalid command: ${filePath}`);
        continue;
      }

      command.category = folder;
      client.commands.set(command.name, command);
      count++;

      if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          client.commands.set(alias, command);
        }
      }
    }
  }

  console.log(`[Command Handler] Loaded ${count} commands.`);
}

module.exports = { loadCommands };
