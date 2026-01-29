const GameManager = require('../../utils/GameManager');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        }

        // Handle Buttons
        else if (interaction.isButton()) {
            if (interaction.customId === 'gamble_yes' || interaction.customId === 'gamble_no') {
                const game = GameManager.getGameByPlayer(interaction.user.id);
                if (!game) {
                    return interaction.reply({ content: "You are not in an active game or round.", flags: MessageFlags.Ephemeral });
                }

                try {
                    const decision = interaction.customId === 'gamble_yes';
                    game.setGamble(interaction.user.id, decision);

                    await interaction.update({
                        content: `You chose to **${decision ? "GAMBLE 🎲" : "PLAY SAFE 🛡️"}**.`,
                        embeds: [],
                        components: []
                    });
                } catch (error) {
                    await interaction.reply({ content: `Error: ${error.message}`, flags: MessageFlags.Ephemeral });
                }
            }
        }
    },
};
