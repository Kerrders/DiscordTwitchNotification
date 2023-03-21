import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  REST,
} from 'discord.js';
import { commandExecudes, registerCommands } from './utils/commandHandler';
import { CONFIG } from './config';
import { TwitchService } from './utils/twitchService';

const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});
const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);

registerCommands(rest);

client.once(Events.ClientReady, async () => {
  const twitchService = new TwitchService(client);
  setInterval(() => {
    twitchService.checkStreamers();
  }, 60000 * 5);
  twitchService.checkStreamers();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandExecudes.find(
    (command) => command.name === interaction.commandName
  );
  if (!command) {
    return;
  }

  await command.execute(interaction);
});

client.login(CONFIG.DISCORD_TOKEN);
