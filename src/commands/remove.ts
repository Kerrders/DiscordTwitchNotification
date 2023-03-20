import { SlashCommandBuilder } from 'discord.js';
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
  async execute(interaction) {
    const streamerName = interaction.options.get('streamer').value;
    if (
      await DatabaseService.removeStreamer(streamerName, interaction.guild.id)
    ) {
      await interaction.reply(
        `${streamerName} wurde erfolgreich von der Liste entfernt`
      );
    } else {
      await interaction.reply(
        `${streamerName} existiert nicht in der Liste oder konnte nicht entfernt werden`
      );
    }
  },
};
