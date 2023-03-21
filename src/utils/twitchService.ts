import { Client, TextChannel } from 'discord.js';
import { StreamerData } from '../interfaces/streamerData.interface';
import { TwitchCredentials } from '../interfaces/twitchCredentials.interface';
import { CONFIG } from '../config';
import { DatabaseService } from './databaseService';
import axios from 'axios';

let tokenExpiredAt: number;
let accessToken: string;

const data: TwitchCredentials = {
  client_id: CONFIG.TWITCH_CLIENT_ID,
  client_secret: CONFIG.TWITCH_SECRET,
  grant_type: 'client_credentials',
};

export class TwitchService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Refresh access token
   *
   * @returns {void}
   */
  private async refreshToken(): Promise<void> {
    await axios
      .post('https://id.twitch.tv/oauth2/token', data)
      .then(function (response) {
        accessToken = response.data.access_token;
        tokenExpiredAt = Date.now() + response.data.expires_in;
      })
      .catch(function () {
        console.log('Fehler beim Laden des Tokens');
      });
  }

  /**
   * Check if streamer is online
   *
   * @param {string} user
   * @returns {boolean}
   */
  private async isStreamerOnline(user: string): Promise<boolean> {
    const res = await axios.get(
      'https://api.twitch.tv/helix/streams?user_login=' + user,
      {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Client-Id': CONFIG.TWITCH_CLIENT_ID,
        },
      }
    );

    if (res.data?.data?.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Check the availability of every streamer
   *
   * @returns {void}
   */
  public async checkStreamers(): Promise<void> {
    if (Date.now() >= tokenExpiredAt || tokenExpiredAt === undefined) {
      await this.refreshToken();
    }

    const guilds = Array.from(this.client.guilds.cache.values());

    await Promise.all(
      guilds.map(async (guild) => {
        const streamers = await DatabaseService.getStreamersbyServer(guild.id);
        const announcedStreamers = new Set(
          streamers
            .filter((streamer) => streamer.announced)
            .map((streamer) => streamer.name)
        );

        for (const streamer of streamers) {
          if (announcedStreamers.has(streamer.name)) {
            continue;
          }

          const channel = this.client.channels.cache.get(
            streamer.channel.toString()
          ) as TextChannel;

          if (!channel) {
            continue;
          }

          const lastMessage = await channel.lastMessage;
          const streamerOnline = await this.isStreamerOnline(streamer.name);

          if (streamerOnline) {
            if (
              lastMessage &&
              lastMessage.content.includes(
                `https://twitch.tv/${streamer.name}`
              ) &&
              Date.now() - lastMessage.createdTimestamp < 60 * 60 * 1
            ) {
              announcedStreamers.add(streamer.name);
              continue;
            }

            await channel.send(`@here https://twitch.tv/${streamer.name}`);
            announcedStreamers.add(streamer.name);
          } else {
            announcedStreamers.delete(streamer.name);
          }
        }

        const updatedStreamers = streamers.map((streamer) => ({
          ...streamer,
          announced: announcedStreamers.has(streamer.name),
        }));

        await DatabaseService.updateList(updatedStreamers, guild.id);
      })
    );
  }
}
