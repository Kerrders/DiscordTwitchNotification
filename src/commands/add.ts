import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseService } from '../utils/databaseService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add streamer to the list')
    .addStringOption((option) =>
      option
        .setName('streamer')
        .setDescription('Input the streamers username')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const streamerName = interaction.options.getString('streamer');
    const streamerExists = (
      await DatabaseService.getStreamersbyServer(interaction.guild.id)
    )?.find((streamer) => streamer.name === streamerName);
    if (streamerExists) {
      await interaction.reply(`${streamerName} is already in the list.`);
      return;
    }
    const addedSuccessfully = await DatabaseService.addStreamer(
      streamerName,
      interaction.guild.id,
      interaction.channel.id
    );
    if (addedSuccessfully) {
      await interaction.reply(
        `${streamerName} was successfully added to the list.`
      );
    } else {
      await interaction.reply(`Failed to add ${streamerName} to the list.`);
    }
  },
};
