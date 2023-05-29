const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("alliance")
        .setDescription("Sets an alliance rep for voting.")
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('The alliance [TAG]')
                .setMinLength(3)
                .setMaxLength(3)
                .setRequired(true))
        .addUserOption(option =>
            option.setName("representative")
                .setDescription("Name of the voting member")
                .setRequired(true)),
    async execute(interaction) {
        const alliance = interaction.options.getString('tag');
        const rep = interaction.options.getUser('representative');

        if (interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            const path = `./servers/${interaction.guild.id}`

            try {
                let voters = {}
                if (fs.existsSync(path)) {
                    voters = JSON.parse(fs.readFileSync(path));

                    if (Object.keys(voters).includes(alliance)) {
                        voters[alliance] = rep.id;
                        fs.writeFileSync(path, JSON.stringify(voters));
                        await interaction.reply(`[${alliance}] Alliance Representative has been switched to ${rep.username}`);
                    } else {
                        voters[alliance] = rep.id;
                        fs.writeFileSync(path, JSON.stringify(voters));
                        await interaction.reply(`${rep.username} has been assigned as [${alliance}] voting representative.`);
                    }
                } else {
                    voters[alliance] = rep.id;
                    fs.writeFileSync(path, JSON.stringify(voters));
                    await interaction.reply(`${rep.username} has been assigned as [${alliance}] voting representative.`);
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            await interaction.reply('Only a server administrator can modify alliance reps');
        }
    },
};