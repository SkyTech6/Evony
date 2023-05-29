const { SlashCommandBuilder, MessageComponentInteraction, EmbedBuilder, Embed, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const fs = require('fs');
const { stringify } = require("querystring");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("propose")
        .setDescription("New rule to be proposed to server")
        .addStringOption(option =>
            option.setName('rule')
                .setDescription("describe the new rule")
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription("hides alliance names from the poll")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('maxvotes')
                .setDescription('voting will automatically end once this number is reached')
                .setRequired(false)
        ),
    async execute(interaction) {
        let rule = interaction.options.getString('rule');
        let anon = interaction.options.getBoolean('anonymous');
        let max = interaction.options.getInteger('maxvotes') ?? 100;

        let ruleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Proposed Rule')
            .setAuthor({ name: interaction.user.username })
            .setDescription(rule)
            .addFields(
                { name: 'Accepted', value: '-\n', inline: true },
                { name: 'Denied', value: '-\n', inline: true }
            )
            .setTimestamp();

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('approve')
                    .setLabel('Approve')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('deny')
                    .setLabel('Deny')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('end')
                    .setLabel('End Voting')
                    .setStyle(ButtonStyle.Secondary)
            )

        let message = await interaction.reply({ embeds: [ruleEmbed], components: [row] });

        let collector = message.createMessageComponentCollector({
            time: 43200000,
        });

        let votedYes = new Array();
        let votedNo = new Array();

        collector?.on("collect", async (i) => {
            await i.deferUpdate();

            if (votedYes.length + votedNo.length === max) return;

            let path = `./servers/${interaction.guild.id}`
            let voters = JSON.parse(fs.readFileSync(path));
            let alliance = '';
            for (var key in voters) {
                if (voters[key] === i.user.id) {
                    alliance = key;
                }
            }

            if (alliance === '') return;

            let receivedEmbed = i.message.embeds[0];
            let curAccepted = receivedEmbed.fields[0].value;
            let curDenied = receivedEmbed.fields[1].value;
            alliance = `[${alliance}]`;

            if (i.customId === 'approve') {
                if (votedNo.includes(alliance)) {
                    votedNo = votedNo.filter(e => e !== alliance);
                }

                if (votedYes.includes(alliance)) return;

                votedYes.push(alliance);

                if (anon) {
                    curAccepted = votedYes.length;
                    curDenied = votedNo.length;
                } else {
                    curAccepted = curAccepted.replace('-', '');
                    curAccepted = curAccepted + "\n" + alliance;
                    curDenied = curDenied.replace(alliance, '');
                }
            }

            if (i.customId === 'deny') {
                if (votedYes.includes(alliance)) {
                    votedYes = votedYes.filter(e => e !== alliance);
                }

                if (votedNo.includes(alliance)) return;

                votedNo.push(alliance);

                if (anon) {
                    curDenied = votedNo.length;
                    curAccepted = votedYes.length;
                } else {
                    curDenied = curDenied.replace('-', '')
                    curDenied = curDenied + "\n" + alliance;
                    curAccepted = curAccepted.replace(alliance, '');
                }
            }

            receivedEmbed.fields[0] = { name: 'Accepted', value: curAccepted, inline: true };
            receivedEmbed.fields[1] = { name: 'Denied', value: curDenied, inline: true };

            let verdict = '';
            if (votedYes.length + votedNo.length === max) {
                if (votedYes > votedNo) {
                    verdict = 'The proposal has been accepted.';
                } else {
                    verdict = 'The proposal has been denied';
                }
            }

            let newEmbed = EmbedBuilder.from(receivedEmbed)

            if (i.customId === 'end' && i.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                if (votedYes > votedNo) {
                    verdict = 'The proposal has been accepted.';
                } else {
                    verdict = 'The proposal has been denied';
                }
            }

            if (verdict !== '') {
                newEmbed.addFields(
                    { name: 'Verdict', value: verdict }
                )

                await i.message.edit({ embeds: [newEmbed], components: [] });
            } else {
                await i.message.edit({ embeds: [newEmbed] });
            }
        });
    }
}