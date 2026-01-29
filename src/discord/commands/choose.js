const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const GameManager = require('../../utils/GameManager');
const ITEMS = require('../../game/Items');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Choose an item for the round')
        .addIntegerOption(option =>
            option.setName('item-id')
                .setDescription('The ID of the item')
                .setRequired(true)),
    async execute(interaction) {
        if (interaction.guild) {
            return interaction.reply({ content: 'Please use this command in DM.', flags: MessageFlags.Ephemeral });
        }

        const game = GameManager.getGameByPlayer(interaction.user.id);
        if (!game) {
            return interaction.reply({ content: 'You are not in a game.', flags: MessageFlags.Ephemeral });
        }

        const itemId = interaction.options.getInteger('item-id');

        try {
            const item = game.chooseItem(interaction.user.id, itemId);

            // Item chosen successfully, now ask for Gamble decision
            const embed = new EmbedBuilder()
                .setTitle("🎲 Gamble Decision")
                .setDescription(`You selected **${item.name}** ($${item.price}).\nDo you want to GAMBLE with it?`)
                .addFields(
                    { name: "Risk", value: "If you win: +1 Point.\nIf you lose: -1 Point + Burn Item.", inline: true },
                    { name: "Safe", value: "0 Points. Keep Item.", inline: true }
                )
                .setColor('#FFD700');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('gamble_yes')
                        .setLabel('Gamble! 🎲')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('gamble_no')
                        .setLabel('Play Safe 🛡️')
                        .setStyle(ButtonStyle.Success),
                );

            await interaction.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            await interaction.reply({ content: `Error: ${error.message}`, flags: MessageFlags.Ephemeral });
        }
    },
};
