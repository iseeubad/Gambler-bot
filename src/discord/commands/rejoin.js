const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const GameManager = require('../../utils/GameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rejoin')
        .setDescription('Rejoin the game if you were AFK'),
    async execute(interaction) {
        const game = GameManager.getGameByPlayer(interaction.user.id);

        if (!game) {
            // Try check if they are in the channel game but not in player map? 
            // Actually GameManager removes them if game ends, but for AFK they are still in game object.
            return interaction.reply({ content: 'You are not in an active game.', flags: MessageFlags.Ephemeral });
        }

        try {
            game.rejoinPlayer(interaction.user.id);
            // Send confirmation DM if possible, or just reply here. Plan said Reply/DM. 
            // Interaction reply is visible to user only if ephemeral, or public. 
            // Let's do a public reply or ephemeral reply. Ephemeral is good to not clutter.
            // User requested: "✅ You’re back! You’ll re-enter starting next round."
            await interaction.reply({
                content: "✅ **Welcome back!** You will re-enter the game starting **next round**.",
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            await interaction.reply({ content: `Error: ${error.message}`, flags: MessageFlags.Ephemeral });
        }
    },
};
