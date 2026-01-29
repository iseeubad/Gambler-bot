const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Learn the rules and commands for Gambler Bot'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎲 Gambler Bot — How to Play')
            .setColor('#FFD700')
            .setDescription(
                'Pick an item each round, then decide to **Gamble** or **Play Safe**. You score by being the **highest UNIQUE gambler**.'
            )
            .addFields(
                {
                    name: '🚀 Quick Start',
                    value:
                        '**Host:** `/hostgame <6-10>` rounds number \n players `/join` → host `/startgame`\n' +
                        'Each round you’ll receive a **DM** with your item list.'
                },
                {
                    name: '🕹️ Round Steps (DM)',
                    value:
                        '**1)** Choose an item using `/choose <number>` (DM only)\n' +
                        '**2)** Two buttons appear instantly:\n' +
                        '• 🎰 **Gamble** (risk it)\n' +
                        '• 🛡️ **Play Safe** (no risk)\n' +
                        '**3)** When everyone decides, the bot posts the results + updated scores.'
                },
                {
                    name: '🏆 Scoring (Important)',
                    value:
                        'The bot checks **only gambled items**:\n' +
                        '• ✅ **Winner (+1):** the player who gambled the **highest-priced item** that was gambled by **exactly 1 player**\n' +
                        '• ❌ **Losers (-1):** everyone else who gambled and didn’t win\n' +
                        '• 🛡️ **Play Safe (0):** no points gained or lost\n' +
                        '• 🤝 **Duplicates (0):** if 2+ players gamble the same item, that item can’t win'
                },
                {
                    name: '🔥 Item Burn (Inventory)',
                    value:
                        '• If you click **Gamble**, that item is **burned** for you (win or lose) and cannot be used again.\n' +
                        '• If you click **Play Safe**, you **keep** the item for later rounds.\n' +
                        '_Saving big items for the right moment is part of the strategy._'
                },
                {
                    name: '⚠️ The Unique Item Rule (Read this!)',
                    value:
                        'The bot searches for the **highest-priced UNIQUE gambled item**:\n' +
                        '• If the top item is duplicated, it is **disqualified** and the bot checks the next highest, and so on.\n' +
                        '• The **winner** is the player who holds the highest item gambled by **exactly 1 player**.\n\n' +
                        '**If NO gambled item is unique** (every gambled item was duplicated), then **there is no winner** and **all gamblers lose -1**.'
                },

                {
                    name: '💤 Anti-AFK (2 minutes)',
                    value:
                        'If you don’t choose an item within **2 minutes**:\n' +
                        '• You become **AFK** (removed from active play)\n' +
                        '• You lose **-1 point per round** while AFK\n' +
                        '• You stop receiving round DMs\n' +
                        '• Use `/rejoin` to return **next round**'
                },
                {
                    name: '⚖️ Tie-Breakers (If top score is tied)',
                    value:
                        '**1)** Fewest items burned\n' +
                        '**2)** Lowest total value of burned items\n' +
                        '**3)** If still tied: shared victory'
                },
                {
                    name: '📜 Commands',
                    value:
                        '**Host:** `/hostgame`, `/startgame`, `/endgame`\n' +
                        '**Players:** `/join`, `/stats`, `/rejoin`\n' +
                        '**DM Only:** `/choose <number>`'
                },
                {
                    name: '💖 Support the Dev',
                    value: 'If you enjoy the bot, consider donating!\n**PayPal**: [Donate Here](https://paypal.me/kujo4jotaro)'
                }
            )
            .setFooter({ text: 'Good luck, and gamble responsibly! 🎲' });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};

