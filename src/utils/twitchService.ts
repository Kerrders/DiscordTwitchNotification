import { Client, TextChannel } from "discord.js";
import { StreamerData } from "../interfaces/streamer-data.interface";
import { TwitchCredentials } from "../interfaces/twitch-credentials.interface";
import { CONFIG } from "../config";
import { DatabaseService } from "./databaseService";
import axios from 'axios';

let tokenExpiredAt: number = 0;
let accessToken: string;

const data: TwitchCredentials = {
    client_id: CONFIG.TWITCH_CLIENT_ID,
    client_secret: CONFIG.TWITCH_SECRET,
    grant_type: "client_credentials"
}

export class TwitchService {
    private client;

    constructor(client) {
        this.client = client;
    }

    /**
     * Refresh access token
     *
     * @returns {void}
     */
    private async refreshToken(): Promise<void>
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
     * Check if streamer is online
     *
     * @param {string} user
     * @returns {boolean}
     */
    private async isStreamerOnline(user: string): Promise<boolean>
    {
        const res = await axios.get('https://api.twitch.tv/helix/streams?user_login=' + user, {
            headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Client-Id': CONFIG.TWITCH_CLIENT_ID
            }
        });

        if(res.data?.data?.length > 0){
            return true;
        }
        return false;
    }

    /**
     * Check the availability of every streamer
     *
     * @returns {void}
     */
    public async checkStreamers(): Promise<void>
    {
        if(Date.now() >= tokenExpiredAt || tokenExpiredAt === undefined) {
            await this.refreshToken();
        }
        this.client.guilds.cache.forEach(async(guild) => {
            const streamers: Array<StreamerData> = await DatabaseService.getStreamersbyServer(guild.id);
            for(const streamer of streamers) {
                const index = streamers.indexOf(streamer);
                if (await this.isStreamerOnline(streamer.name)) {
                    const channel = await this.client.channels.cache.find(channel => channel.id == streamer.channel);
                    if (!channel || streamers[index].announced) continue;
                    const lastMessage = (channel as TextChannel).lastMessage;
                    if(lastMessage && lastMessage.content.search(`https://twitch.tv/${streamer.name}`) !== -1 && (Date.now() - lastMessage.createdTimestamp) < 60*60*1){
                        streamers[index].announced = true;
                        continue;
                    }
                    await (channel as TextChannel).send(`@here https://twitch.tv/${streamer.name}`);
                    streamers[index].announced = true;
                } else {
                    streamers[index].announced = false;
                }
            }
            await DatabaseService.updateList(streamers, guild.id);
        });
    }
}