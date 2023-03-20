import { SlashCommandBuilder } from "discord.js";
import { DatabaseService } from "../utils/databaseService";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add streamer to the list')
        .addStringOption(option =>
            option.setName('streamer')
                .setDescription('Input the streamers username')
                .setRequired(true)),
	async execute(interaction) {
    const streamerName = interaction.options.get('streamer').value;
    const streamerFound = (await DatabaseService.getStreamersbyServer(interaction.guild.id)).find(streamer => streamer.name == streamerName);
    if(streamerFound !== undefined) {
        await interaction.reply(`${streamerName} ist bereits in der Liste`);
        return;
      }
      if(await DatabaseService.addStreamer(streamerName, interaction.guild.id, interaction.channel.id)) {
        await interaction.reply(`${streamerName} wurde erfolgreich zur Liste hinzugefügt`);
      } else {
        await interaction.reply(`${streamerName} konnte nicht zur Liste hingezugefügt werden`);
      }
	},
};