import jsoning = require('jsoning');
import { StreamerData } from '../interfaces/streamer-data.interface';

const db = new jsoning('database.json');

export class DatabaseService {
  /**
   * Get notification list
   *
   * @param guildId
   * @returns Promise<Array<StreamerData>>
   */
  public static async getStreamersbyServer(
    guildId: number | string
  ): Promise<Array<StreamerData>> {
    if (db.has(`${guildId}_streamers`)) {
      return await db.get(`${guildId}_streamers`);
    }
    return [];
  }

  /**
   * Add streamer to notification list
   *
   * @param streamerName
   * @param guildId
   * @param channelId
   * @returns Promise<boolean>
   */
  public static async addStreamer(
    streamerName: string,
    guildId: string,
    channelId: string
  ): Promise<boolean> {
    return db.push(`${guildId}_streamers`, {
      name: streamerName,
      channel: channelId,
      announced: false,
    });
  }

  /**
   * Remove streamer from notification list
   *
   * @param streamerName
   * @param guildId
   * @returns Promise<boolean>
   */
  public static async removeStreamer(
    streamerName: string,
    guildId: string
  ): Promise<boolean> {
    const streamers = await DatabaseService.getStreamersbyServer(guildId);
    const streamerFound = streamers.find(
      (streamer) => streamer.name == streamerName
    );
    if (streamerFound === undefined) {
      return false;
    }
    return db.set(
      `${guildId}_streamers`,
      streamers.filter((obj) => obj !== streamerFound)
    );
  }

  /**
   * Update notification list
   *
   * @param streamerName
   * @param guildId
   * @returns Promise<boolean>
   */
  public static async updateList(
    streamers: Array<StreamerData>,
    guildId: string
  ): Promise<boolean> {
    return db.set(`${guildId}_streamers`, streamers);
  }
}
