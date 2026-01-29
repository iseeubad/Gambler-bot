const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Game } = require('../../game/Game');
const GameManager = require('../../utils/GameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hostgame')
        .setDescription('Host a new gambling game')
        .addIntegerOption(option =>
            option.setName('rounds')
                .setDescription('Number of rounds (6-10)')
                .setRequired(true)
                .setMinValue(6)
                .setMaxValue(10)),
    async execute(interaction) {
        const rounds = interaction.options.getInteger('rounds');
        const channelId = interaction.channelId;
        const hostId = interaction.user.id;

        if (GameManager.getGame(channelId)) {
            return interaction.reply({ content: 'A game is already running in this channel.', flags: MessageFlags.Ephemeral });
        }

        const game = new Game(hostId, channelId, rounds);
        GameManager.createGame(channelId, game);

        // Setup event listeners for the game (to send messages back to discord)
        // This acts as the bridge between Logic and UI
        const setupGameEvents = require('../handlers/gameEventHandler');
        setupGameEvents(game, interaction.client, interaction.channel);

        await interaction.reply({
            content: `🎲 **Lobby Open!**\nHost: ${interaction.user}\nRounds: ${rounds}\n\nType \`/join\` to join the game!\nHost can type \`/startgame\` when ready.`
        });
    },
};
