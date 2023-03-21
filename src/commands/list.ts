import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { StreamerData } from '../interfaces/streamerData.interface';
import { DatabaseService } from '../utils/databaseService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Get current streamer list'),
  async execute(interaction: ChatInputCommandInteraction) {
    const streamers = await DatabaseService.getStreamersbyServer(
      interaction.guild.id
    );
    if (!streamers.length) {
      await interaction.reply('The streamer list is still empty');
      return;
    }
    const streamerNames = streamers.map(
      (streamer: StreamerData) => streamer.name
    );
    const embed = new EmbedBuilder()
      .setTitle('Notification List')
      .setDescription(streamerNames.join('\n'))
      .setColor('#00FF00')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
