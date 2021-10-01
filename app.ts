import { StreamerData } from "./interfaces/streamer-data-interface";
import { TwitchCredentials } from "./interfaces/twitch-credentials-interface";
import { Client, Intents, TextChannel } from 'discord.js';
import axios from 'axios';
import * as dotenv from "dotenv";
import jsoning = require("jsoning");

const client: Client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ,Intents.FLAGS.DIRECT_MESSAGES] });
const prefix = '!';
const db = new jsoning("database.json");
let accessToken: string;
let tokenExpiredAt: number;
dotenv.config();

const data: TwitchCredentials = {
  client_id: process.env.TWITCH_CLIENT_ID,
  client_secret: process.env.TWITCH_SECRET,
  grant_type: "client_credentials"
}

/**
 * Check if streamer is online
 *
 * @param {string} user
 * @returns {boolean}
 */
async function isStreamerOnline(user: string): Promise<boolean>
{
  const res = await axios.get('https://api.twitch.tv/helix/streams?user_login=' + user, {
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Client-Id': process.env.TWITCH_CLIENT_ID
    }
  });

  if(res.data?.data?.length > 0){
    return true;
  }
  return false;
}

/**
 * Refresh access token
 *
 * @returns {void}
 */
 async function refreshToken(): Promise<void>
 {
  await axios.post('https://id.twitch.tv/oauth2/token', data).then(function (response) {
    accessToken = response.data.access_token;
    tokenExpiredAt = Date.now() + response.data.expires_in;
  })
  .catch(function () {
    console.log('Fehler beim Laden des Tokens');
  });
 }

/**
 * Check and streamers
 *
 * @returns {void}
 */
async function checkStreamers(): Promise<void>
{
  if(Date.now() >= tokenExpiredAt || tokenExpiredAt === undefined) {
    await refreshToken();
  }
  client.guilds.cache.forEach(async(guild) => {
    const streamers: Array<StreamerData> = await getStreamersbyServer(parseInt(guild.id));
    for(const streamer of streamers) {
      const index = streamers.indexOf(streamer);
      if (await isStreamerOnline(streamer.name)) {
        const channel = client.channels.cache.find(channel => parseInt(channel.id) == streamer.channel)
        if (!channel || streamers[index].announced) return;
        (channel as TextChannel).send(`@here https://twitch.tv/${streamer.name}`);
        streamers[index].announced = true;
      } else {
        streamers[index].announced = false;
      }
    }
    await db.set(`${guild.id}_streamers`, streamers);
  });
}

/**
 * Get streamers by server id
 *
 * @returns {Array<StreamerData>}
 */
async function getStreamersbyServer(serverId: number): Promise<Array<StreamerData>>
{
  if(await db.has(`${serverId}_streamers`)){
    return await db.get(`${serverId}_streamers`);
  }
  return [];
}

client.once('ready', async() => {
  client.user.setPresence({
    status: 'online',
    activities: [{
        name: 'KeRR#0001',
        type: 'WATCHING'
    }]
  })
  setInterval(()=> { checkStreamers() }, 60000 * 5);
  checkStreamers();
});

client.on("messageCreate", async(message) => {
  if (message.author.bot) return;
  if (message.content.indexOf(prefix) !== 0) return;
  if (!message.member.permissions.has('ADMINISTRATOR')) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if((command !== 'streameradd' && command !== 'streamerremove' && command !== 'streamerlist') || !args.length && command !== 'streamerlist') {
    return;
  }
  const streamers: Array<StreamerData> = await getStreamersbyServer(parseInt(message.guild.id));
  const streamerName = args.length ? args[0] : '';
  const streamerFound = streamers.find(streamer => streamer.name == streamerName);
  switch (command) {
    case 'streameradd':
      {
        if(streamerFound !== undefined) {
          await message.channel.send(`${streamerName} ist bereits in der Liste`);
          return;
        }
        db.push(`${message.guild.id}_streamers`, JSON.stringify({
          name: streamerName,
          channel: parseInt(message.channel.id),
          announced: false
        }));
        await message.channel.send(`${streamerName} wurde erfolgreich zur Liste hinzugefügt`);
        break;
      }

      case 'streamerremove':
        {
          if(streamerFound === undefined) {
            await message.channel.send(`${streamerName} existiert nicht in der Liste`);
            return;
          }
          db.set(`${message.guild.id}_streamers`, streamers.filter(obj => obj !== streamerFound));
          await message.channel.send(`${streamerName} wurde erfolgreich von der Liste entfernt`);
          break;
        }

      case 'streamerlist':
        {
          const streamerNames: string = streamers.map(function(streamer: StreamerData){
            return streamer.name;
          }).join(",");
          await message.channel.send(`Benachrichtigungen für folgende Streamer aktiviert: ${streamerNames}`);
          break;
        }
    default:
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);