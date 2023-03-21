import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseService } from '../utils/databaseService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove streamer from the list')
    .addStringOption((option) =>
      option
        .setName('streamer')
        .setDescription('Input the streamers username')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const streamerName = interaction.options.get('streamer')?.value;
    if (
      await DatabaseService.removeStreamer(
        streamerName.toString(),
        interaction.guild.id
      )
    ) {
      await interaction.reply(
        `${streamerName} was successfully removed from the list`
      );
      return;
    }
    await interaction.reply(
      `${streamerName} does not exist in the list or could not be removed`
    );
  },
};
