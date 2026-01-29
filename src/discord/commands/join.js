const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const GameManager = require('../../utils/GameManager');
const { GameState } = require('../../game/Game');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join the current game lobby'),
    async execute(interaction) {
        const channelId = interaction.channelId;
        const game = GameManager.getGame(channelId);

        if (!game) {
            return interaction.reply({ content: 'No game in this channel.', flags: MessageFlags.Ephemeral });
        }

        if (game.state !== GameState.LOBBY) {
            return interaction.reply({ content: 'Game has already started.', flags: MessageFlags.Ephemeral });
        }

        try {
            const count = game.addPlayer(interaction.user.id, interaction.user.username);
            GameManager.addPlayerToGame(interaction.user.id, channelId);
            await interaction.reply(`${interaction.user} joined the game! (${count} players)`);
        } catch (error) {
            await interaction.reply({ content: error.message, flags: MessageFlags.Ephemeral });
        }
    },
};
