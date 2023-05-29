const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Lists out the possible commands for Evony Diplomacy"),
    async execute(interaction) {
        await interaction.reply('Alliance command will allow you set a voting representative for the specified alliance; for example: \n ```/alliance DED SkyTech6``` \n Propose command can be used to propose a new server rule which can then be voted on; as such:\n ```/propose Barbs are treated as tiles during KE/BOB```');
    },
};