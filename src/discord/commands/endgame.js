const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const GameManager = require('../../utils/GameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('endgame')
        .setDescription('Force end the current game (Host only)'),
    async execute(interaction) {
        const game = GameManager.getGame(interaction.channelId);

        if (!game) {
            return interaction.reply({ content: 'No game running in this channel.', flags: MessageFlags.Ephemeral });
        }

        if (interaction.user.id !== game.hostId) {
            // Check if admin? For now just host.
            return interaction.reply({ content: 'Only the host can end the game.', flags: MessageFlags.Ephemeral });
        }

        try {
            game.endGame();
            await interaction.reply("⏹️ **Game ended by host.**");
        } catch (error) {
            await interaction.reply({ content: `Error: ${error.message}`, flags: MessageFlags.Ephemeral });
        }
    },
};
