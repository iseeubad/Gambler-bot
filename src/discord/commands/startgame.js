const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const GameManager = require('../../utils/GameManager');
const { GameState } = require('../../game/Game');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startgame')
        .setDescription('Start the game (Host only)'),
    async execute(interaction) {
        const channelId = interaction.channelId;
        const game = GameManager.getGame(channelId);

        if (!game) {
            return interaction.reply({ content: 'No game in this channel.', flags: MessageFlags.Ephemeral });
        }

        if (interaction.user.id !== game.hostId) {
            return interaction.reply({ content: 'Only the host can start the game.', flags: MessageFlags.Ephemeral });
        }

        if (game.state !== GameState.LOBBY) {
            return interaction.reply({ content: 'Game already started.', flags: MessageFlags.Ephemeral });
        }

        try {
            game.start();
            await interaction.reply("🚀 **Game Starting!** Check your DMs for items.");
        } catch (error) {
            await interaction.reply({ content: `Error: ${error.message}`, flags: MessageFlags.Ephemeral });
        }
    },
};
