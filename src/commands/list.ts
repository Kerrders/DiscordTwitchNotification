import { SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Get current streamer list'),
	async execute(interaction) {
		await interaction.reply('Pong! hehe');
	},
};