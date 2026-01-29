const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const GameManager = require('../../utils/GameManager');
const ITEMS = require('../../game/Items');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View current points and status'),
    async execute(interaction) {
        // Try getting game from channel, or if DM, try getting by player
        let game = GameManager.getGame(interaction.channelId);
        if (!game) {
            game = GameManager.getGameByPlayer(interaction.user.id);
        }

        if (!game) {
            return interaction.reply({ content: 'No active game found for you.', flags: MessageFlags.Ephemeral });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📊 Game Stats - Round ${game.round}`)
            .setColor('#0099ff');

        const players = Array.from(game.players.values())
            .sort((a, b) => b.points - a.points);

        let description = '';
        for (const p of players) {
            const status = p.eliminated ? "☠️ ELIMINATED" : "Playing";
            const lastGamble = p.currentGamble === true ? "✅" : (p.currentGamble === false ? "🛡️" : "⏳");
            // Show burned items count or list
            description += `**${p.username}**: ${p.points} pts | ${status}\n`;
        }

        // If DM, show personal detailed stats
        if (!interaction.guild) {
            const me = game.players.get(interaction.user.id);
            if (me) {
                const burnedNames = Array.from(me.burned).map(id => ITEMS.find(i => i.id === id)?.name).join(', ') || "None";
                embed.addFields({ name: 'Your Burned Items', value: burnedNames });
            }
        }

        embed.setDescription(description);

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },
};
