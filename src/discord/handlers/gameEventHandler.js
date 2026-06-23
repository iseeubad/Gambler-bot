const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ITEMS = require('../../game/Items');

module.exports = (game, client, channel) => {

    // Round Start: Send items to DMs
    game.on('roundStart', async ({ round, players, endTime }) => {
        const timestamp = endTime ? `<t:${Math.floor(endTime / 1000)}:R>` : "2 minutes";
        await channel.send(`📢 **Round ${round} Started!** Ends ${timestamp}. Check your DMs for the item list.`).catch(console.error);

        for (const player of players) {
            if (player.eliminated || player.isAfk) continue;

            const user = await client.users.fetch(player.id).catch(console.error);
            if (!user) continue;

            const embed = new EmbedBuilder()
                .setTitle(`🎒 Round ${round} Item List`)
                .setDescription(`Use \`/choose item-id:<id>\` to pick an item.`)
                .setColor('#2E8B57');

            // Build item list, cross out burned items
            let fieldVal = "";
            ITEMS.forEach(item => {
                const isBurned = player.hasBurned(item.id);
                const name = isBurned ? `~~${item.name}~~` : item.name;
                const price = `$${item.price}`;
                const status = isBurned ? "(Burned)" : "";
                fieldVal += `**${item.id}.** ${name} - ${price} ${status}\n`;
            });

            embed.addFields({ name: "Available Items", value: fieldVal });

            await user.send({ embeds: [embed] }).catch(() => {
                channel.send(`⚠️ Could not DM ${player.username}. Please enable DMs.`).catch(console.error);
            });
        }
    });

    // AFK Event
    game.on('playersAfk', async (afkPlayers) => {
        const names = afkPlayers.map(p => p.username).join(', ');
        channel.send(`⏳ **Time's up!** The following players are now AFK: **${names}** (-1 Point/round).`).catch(console.error);

        for (const player of afkPlayers) {
            const user = await client.users.fetch(player.id).catch(() => null);
            if (user) {
                user.send("⏱️ **You didn't choose in time**, so you're now marked AFK. Use `/rejoin` to return next round.").catch(() => { });
            }
        }
    });

    // Player Gamble: Maybe update a status board in channel?
    game.on('playerGamble', async ({ playerId, decision }) => {
        // We could edit a message in the channel to show who is ready
        // For now, let's just log or maybe send a subtle message if needed
    });

    // Timer Warning
    game.on('roundTimeWarning', (secondsRemaining) => {
        let msg = `⚠️ **${secondsRemaining} seconds remaining!**`;
        if (secondsRemaining >= 60) {
            msg = `⚠️ **${secondsRemaining / 60} minute remaining!**`;
        }
        channel.send(msg).catch(console.error);
    });

    // Timer Start
    game.on('roundTimerStart', (duration) => {
        channel.send(`⏳ **All players have decided!** Round ends in ${duration / 1000} seconds...`).catch(console.error);
    });

    // Round Ends
    game.on('roundEnded', async ({ roundLog, winnerId }) => {
        const embed = new EmbedBuilder()
            .setTitle(`🏆 Round ${game.round} Results`)
            .setColor('#FF4500');

        // 1. Round Recap
        let recap = "**Round Recap**\n";

        if (winnerId) {
            const winner = roundLog.find(l => l.playerId === winnerId);
            recap += `🏆 **Winner (+1)**: ${winner.username} with **${winner.choice.name}**\n`;
        } else {
            recap += `🏆 **Winner**: None\n`;
        }

        const losers = roundLog.filter(l => l.result === 'LOSS').map(l => l.username);
        const safe = roundLog.filter(l => l.result === 'SAFE').map(l => l.username);
        const newAfk = roundLog.filter(l => l.result === 'AFK').map(l => l.username);
        const eliminated = roundLog.filter(l => l.event === 'ELIMINATED').map(l => l.username); // 'event' check might need adjustment depending on how log is structured

        if (losers.length) recap += `📉 **Lost (-1)**: ${losers.join(', ')}\n`;
        if (safe.length) recap += `🛡️ **Safe (0)**: ${safe.join(', ')}\n`;
        if (newAfk.length) recap += `💤 **Became AFK**: ${newAfk.join(', ')}\n`;
        if (eliminated.length) recap += `☠️ **Eliminated**: ${eliminated.join(', ')}\n`;

        embed.setDescription(recap);

        // 2. Scoreboard (Compact)
        const players = Array.from(game.players.values()).sort((a, b) => b.points - a.points);
        let scoreboard = "";

        for (const p of players) {
            let status = "✅";
            if (p.eliminated) status = "☠️";
            else if (p.isAfk) status = "💤";

            scoreboard += `${status} **${p.username}**: ${p.points} pts\n`;
        }

        embed.addFields({ name: "📊 Scoreboard", value: scoreboard });

        await channel.send({ embeds: [embed] }).catch(console.error);

        // Send Elimination DMs
        // Check roundLog for "ELIMINATED" events or check existing players
        const eliminatedPlayers = roundLog.filter(l => l.event === 'ELIMINATED');
        for (const log of eliminatedPlayers) {
            const user = await client.users.fetch(log.playerId).catch(() => null);
            if (user) {
                user.send("☠️ **You've been eliminated** (score reached -3).").catch(() => { });
            }
        }

        // Auto-start next round logic could be here or triggered via timeout
        setTimeout(() => {
            if (game.state !== 'GAME_OVER') {
                game.nextRound();
            }
        }, 8000); // 8 seconds to read results
    });

    // Game Ends
    game.on('gameEnded', async ({ winners, leaderboard }) => {
        const embed = new EmbedBuilder()
            .setTitle("🏁 Game Over!")
            .setColor('#FFD700');

        let desc = "**Leaderboard**\n";
        leaderboard.forEach((p, idx) => {
            desc += `${idx + 1}. **${p.username}**: ${p.points} pts (Burned Value: $${game.getBurnValue(p)})\n`;
        });
        embed.setDescription(desc);

        if (winners.length > 0) {
            const winnerNames = winners.map(p => p.username).join(', ');
            channel.send(`🎉 **CONGRATULATIONS TO THE WINNER(S): ${winnerNames}** 🎉`).catch(console.error);
        }

        channel.send({ embeds: [embed] }).catch(console.error);

        // Cleanup
        const GameManager = require('../../utils/GameManager');
        GameManager.removeGame(channel.id);
    });
};
