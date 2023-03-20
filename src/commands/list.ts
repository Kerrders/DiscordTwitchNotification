import { SlashCommandBuilder } from "discord.js";
import { StreamerData } from "../interfaces/streamer-data.interface";
import { DatabaseService } from "../utils/databaseService";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Get current streamer list'),
	async execute(interaction) {
		const streamerNames = await (await DatabaseService.getStreamersbyServer(interaction.guild.id)).map(function(streamer: StreamerData){
            return streamer.name;
          }).join(",");
		if(!streamerNames.length) {
			await interaction.reply(`Die Streamerliste ist noch leer`);
			return;
		}
        await interaction.reply(`Benachrichtigungen für folgende Streamer aktiviert: ${streamerNames}`);
	},
};