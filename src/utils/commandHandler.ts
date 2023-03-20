import { readdirSync } from 'fs';
import { join } from 'path';
import { REST, Routes } from 'discord.js';
import { CONFIG } from '../config';

export const commandExecudes = [];

export const registerCommands = async (rest: REST): Promise<void> => {
  const commandFiles = readdirSync(join(__dirname, '../commands')).filter(
    (file) => file.endsWith('.ts')
  );
  const commands = [];

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commandExecudes.push({
      name: command.data.name,
      execute: command.execute,
    });
    commands.push(command.data.toJSON());
  }

  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );
    await rest.put(
      Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
      { body: commands }
    );
  } catch (error) {
    console.error(error);
  }
};
