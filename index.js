const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const keep_alive = require('./keep_alive.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

const token = process.env["token"];
const PREFIX = "!";

// Game State
let game = {
    players: [],
    items: [
        { name: "Notebook", price: 5 },
        { name: "Coffee Mug", price: 10 },
        { name: "Wireless Mouse", price: 20 },
        { name: "Bluetooth Speaker", price: 50 },
        { name: "Portable Power Bank", price: 70 },
        { name: "AirPods", price: 150 },
        { name: "Smartwatch", price: 300 },
        { name: "Laptop", price: 800 },
        { name: "iPhone", price: 1000 },
    ],
    round: 0,
    maxRounds: 10,
    numberPlayers: 0,
    gameStarted: false,
    lobbyOpen: false,
    host: null,
    choices: {},
    gambles: {},
    points: {},
    gambledItems: {},
    responses: {},  // Track responses for each round
    hostChannel: null, // Track the channel where the game was hosted
};

client.once("ready", () => {
    console.log("Bot is online!");
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "choose") {
        if (message.channel.type === 1) {  // 1 indicates a DM channel
            if (!game.gameStarted) {
                return message.channel.send("No game in progress.");
            }
            if (!game.players.includes(message.author.id)) {
                return message.channel.send("You are not a player in this game.");
            }
            if (game.choices[message.author.id]) {
                return message.channel.send("You have already chosen an item.");
            }

            const itemIndex = parseInt(args[0]);
            if (
                isNaN(itemIndex) ||
                itemIndex < 1 ||
                itemIndex > game.items.length
            ) {
                return message.channel.send(
                    "Invalid item index. Please choose a valid item number.",
                );
            }
            const item = game.items[itemIndex - 1];
            if (
                game.gambledItems[message.author.id] &&
                game.gambledItems[message.author.id].includes(item.name)
            ) {
                return message.channel.send("You have already gambled with this item. Please choose another item.");
            }
            game.choices[message.author.id] = item;
            message.channel.send(`You chose ${item.name}`);

            // Send the gambling confirmation embed
            const gambleEmbed = new EmbedBuilder()
                .setTitle("Gamble Confirmation")
                .setDescription(`Do you want to gamble with the ${item.name}?`)
                .setColor("#BA4746");

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("gamble_yes")
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("gamble_no")
                        .setLabel("No")
                        .setStyle(ButtonStyle.Secondary)
                );

            await message.channel.send({ embeds: [gambleEmbed], components: [buttons] });
        }
    }

    if (command === "hostgame") {
        if (game.gameStarted) {
            message.channel.send("A game is already in progress.");
            return;
        }
        if (game.lobbyOpen) {
            message.channel.send("A lobby is already open.");
            return;
        }
        const maxRounds = parseInt(args[0]);
        if (isNaN(maxRounds) || maxRounds < 6 || maxRounds > 10) {
            message.channel.send(
                "Please specify a valid number of rounds (between 6 and 10).",
            );
            return;
        }
        game.maxRounds = maxRounds;
        game.lobbyOpen = true;
        game.host = message.author.id;
        game.hostChannel = message.channel; // Track the host channel
        message.channel.send(
            `${message.author} is hosting a game with ${maxRounds} rounds! Type !join to participate.`,
        );
    }

    if (command === "join") {
        if (!game.lobbyOpen) {
            message.channel.send("No lobby is open.");
            return;
        }
        if (game.players.includes(message.author.id)) {
            message.channel.send("You are already in the lobby.");
            return;
        }
        game.players.push(message.author.id);
        game.numberPlayers++;
        message.channel.send(
            `${message.author} has joined the game (${game.numberPlayers}/12).`,
        );
    }

    if (command === "startgame") {
        if (!game.lobbyOpen) {
            message.channel.send("No lobby is open.");
            return;
        }
        if (message.author.id !== game.host) {
            message.channel.send("Only the host can start the game.");
            return;
        }
        if (game.players.length < 0) {
            message.channel.send(
                "Not enough players to start the game. Minimum 5 players required.",
            );
            return;
        }

        // Start the game
        game.gameStarted = true;
        game.lobbyOpen = false;
        game.round = 1;
        game.players.forEach((player) => {
            game.points[player] = 0;
        });
        message.channel.send(`Game started!!`);

        // Send the item list to all players
        sendItemListToPlayers();
    }

    if (command === "endround") {
        if (!game.gameStarted) {
            message.channel.send("No game in progress.");
            return;
        }
        if (message.author.id !== game.host) {
            message.channel.send("Only the host can end the round.");
            return;
        }
        endRound(game.hostChannel);  // Pass the host channel
    }

    if (command === "points") {
        if (!game.gameStarted) {
            message.channel.send("No game in progress.");
            return;
        }

        let pointsEmbed = new EmbedBuilder()
            .setTitle('Player Points')
            .setColor('#BA4746');

        for (const playerId of Object.keys(game.points)) {
            const user = await client.users.fetch(playerId);
            const status = game.points[playerId] <= -3 ? "Eliminated" : "Playing";
            pointsEmbed.addFields({ name: user.username, value: `${game.points[playerId]} points (${status})`, inline: true });
        }

        message.channel.send({ embeds: [pointsEmbed] });
    }

    if (command === "endgame") {
        if (!game.gameStarted) {
            message.channel.send("No game in progress.");
            return;
        }
        if (message.author.id !== game.host) {
            message.channel.send("Only the host can end the game.");
            return;
        }

        game.gameStarted = false;
        game.lobbyOpen = false;
        message.channel.send("The game has been ended by the host.");

        // Display final points
        let finalPointsEmbed = new EmbedBuilder()
            .setTitle('Final Player Points')
            .setColor('#BA4746');

        for (const playerId of Object.keys(game.points)) {
            const user = await client.users.fetch(playerId);
            const status = game.points[playerId] <= -3 ? "Eliminated" : "Playing";
            finalPointsEmbed.addFields({ name: user.username, value: `${game.points[playerId]} points (${status})`, inline: true });
        }

        message.channel.send({ embeds: [finalPointsEmbed] });

        // Reset game state
        game.players = [];
        game.choices = {};
        game.gambles = {};
        game.gambledItems = {};
        game.points = {};
        game.responses = {};  // Reset responses
        game.round = 0;
        game.numberPlayers = 0;
        game.host = null;
        game.hostChannel = null;  // Reset host channel
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const message = interaction.message;

    if (interaction.customId === 'gamble_yes' || interaction.customId === 'gamble_no') {
        game.gambles[userId] = interaction.customId === 'gamble_yes';
        const chosenItem = game.choices[userId];
        if (!game.gambledItems[userId]) {
            game.gambledItems[userId] = [];
        }
        if (interaction.customId === 'gamble_yes') {
            game.gambledItems[userId].push(chosenItem.name);
            await interaction.reply({
                content: `You chose to gamble with ${chosenItem.name}.`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "You chose not to gamble.",
                ephemeral: true
            });
        }

        // Edit the original message to remove the buttons
        await message.edit({
            components: []  // This removes the buttons
        });

        game.responses[userId] = true;  // Mark this player as having responded

        // Update the status embed
        const user = await client.users.fetch(userId);
        game.playerStatusEmbed.addFields({
            name: user.username,
            value: "Ready",
            inline: true
        });

        const readyPlayers = Object.keys(game.responses).length;
        const totalPlayers = game.players.length;

        // Update the embed title with the number of ready players
        game.playerStatusEmbed.setTitle(`Ready status (${readyPlayers}/${totalPlayers})`);

        await game.statusMessage.edit({ embeds: [game.playerStatusEmbed] });

        checkAllResponses(interaction.message);
    }
});

function checkAllResponses(message) {
    const allResponded = game.players.every(playerId => game.responses[playerId]);
    if (allResponded) {
        setTimeout(() => {
            endRound(game.hostChannel);  // Pass the host channel
        }, 5000);  // 5 seconds countdown
    }
}

async function sendItemListToPlayers() {
    const totalPlayers = game.players.length;

    // First send the round start message
    await game.hostChannel.send(`Round ${game.round} starts now! The item list has been sent to all players.\nUse !choose <item_index> to choose an item.`);

    // Create the initial "Ready status" embed with (0/T)
    game.playerStatusEmbed = new EmbedBuilder()
        .setTitle(`Ready status (0/${totalPlayers})`)
        .setDescription("Players who have completed the gamble question will be listed here.")
        .setColor("#BA4746");

    // Send the embed to the host channel and store the message
    game.hostChannel.send({ embeds: [game.playerStatusEmbed] }).then(sentMessage => {
        game.statusMessage = sentMessage; // Store the message for later updates
    });

    for (const playerId of game.players) {
        const user = await client.users.fetch(playerId);

        // Create the embed for the player
        const itemListEmbed = new EmbedBuilder()
            .setTitle("Item List")
            .setDescription("Choose an item by using the command !choose <item_index>")
            .setColor("#BA4746");

        game.items.forEach((item, index) => {
            // Check if the item has been gambled by the player
            const gambled = game.gambledItems[playerId] && game.gambledItems[playerId].includes(item.name);
            const itemName = gambled ? `~~${item.name}~~` : item.name;
            itemListEmbed.addFields({ name: `${index + 1}. ${itemName}`, value: `$${item.price}`, inline: true });
        });

        // Send the embed to the player
        user.send({ embeds: [itemListEmbed] });
    }
}

async function endRound(channel) {
    // Create an object to store the items chosen by players who decided to gamble
    let gambledChoices = {};

    // Populate the gambledChoices object with the choices of players who decided to gamble
    Object.keys(game.gambles).forEach(playerId => {
        if (game.gambles[playerId] && game.choices[playerId]) {
            gambledChoices[playerId] = game.choices[playerId];
        }
    });

    // Sort the gambled items by price in descending order
    const sortedItems = Object.values(gambledChoices).sort((a, b) => b.price - a.price);
    let pointsAwarded = false; // Flag to check if points have been awarded
    let eliminatedPlayers = []; // Array to track players who will be eliminated
    let itemsNotAwarded = new Set(); // Set to track items with multiple gamblers
    let playersNotAwarded = new Set(); // Set to track players who gambled with items that had multiple gamblers

    // Iterate through the sorted items to determine point allocation
    for (let i = 0; i < sortedItems.length; i++) {
        const currentItem = sortedItems[i];
        // Find players who chose the current item
        const playersWithCurrentItem = Object.keys(gambledChoices).filter(
            playerId => gambledChoices[playerId].price === currentItem.price
        );

        // If only one player chose the current item
        if (playersWithCurrentItem.length === 1) {
            const winnerId = playersWithCurrentItem[0];
            // Award the player with 1 point
            game.points[winnerId] = (game.points[winnerId] || 0) + 1;
            channel.send(
                `<@${winnerId}> gains +1 point for choosing the ${gambledChoices[winnerId].name}, which is the most expensive item that wasn't gambled by multiple players.`
            );

            // Deduct points for all other gamblers who didn't gamble with itemsNotAwarded
            Object.keys(gambledChoices).forEach(playerId => {
                if (playerId !== winnerId && !playersNotAwarded.has(playerId)) {
                    game.points[playerId] = (game.points[playerId] || 0) - 1;
                    const lostItem = game.choices[playerId].name;
                    channel.send(
                        `<@${playerId}> gambled with ${lostItem} and loses -1 point.`
                    );
                }
            });

            pointsAwarded = true; // Set the flag to indicate that points have been awarded
            break; // Exit the loop since points have been awarded
        } else {
            // If multiple players chose the current item, add it to the itemsNotAwarded set
            playersWithCurrentItem.forEach(playerId => {
                if (!itemsNotAwarded.has(currentItem.name)) {
                    game.points[playerId] = game.points[playerId] || 0;
                }
                playersNotAwarded.add(playerId);
            });
            itemsNotAwarded.add(currentItem.name);
        }
    }

    // If no points were awarded and there were items with multiple gamblers
    if (playersNotAwarded.size > 0) {
        channel.send(
            `Multiple players gambled with the following items: ${Array.from(itemsNotAwarded).join(', ')}. No points awarded for these items.`
        );
    } else if (!pointsAwarded) {
        channel.send("No points awarded this round.");
    }

    // Eliminate players with -3 or fewer points
    game.players = game.players.filter(playerId => {
        if (game.points[playerId] <= -3) {
            eliminatedPlayers.push(playerId);
            return false;
        }
        return true;
    });

    // Announce eliminated players
    if (eliminatedPlayers.length > 0) {
        eliminatedPlayers.forEach(playerId => {
            channel.send(
                `<@${playerId}> has been eliminated with ${game.points[playerId]} points.`
            );
        });
    }

    // Create an embed to display the current points of all players
    let pointsEmbed = new EmbedBuilder()
        .setTitle("Current Points")
        .setColor("#BA4746");

    for (const playerId of Object.keys(game.points)) {
        const user = await client.users.fetch(playerId);
        const status = game.players.includes(playerId) ? "Playing" : "Eliminated";
        pointsEmbed.addFields({
            name: user.username,
            value: `${game.points[playerId]} points (${status})`,
            inline: true
        });
    }

    channel.send({ embeds: [pointsEmbed] });

    // Create an embed to summarize the round
    let roundSummaryEmbed = new EmbedBuilder()
        .setTitle("Round Summary")
        .setColor("#BA4746");

    for (const playerId of game.players) {
        const user = await client.users.fetch(playerId);
        const choice = game.choices[playerId] ? game.choices[playerId].name : "No choice";
        const price = game.choices[playerId] ? `$${game.choices[playerId].price}` : "N/A";
        const gambled = game.gambles[playerId] ? "✅" : "❌";
        roundSummaryEmbed.addFields({
            name: user.username,
            value: `Item: ${choice}\nPrice: ${price}\nGambled: ${gambled}`,
            inline: true
        });
    }

    channel.send({ embeds: [roundSummaryEmbed] });

    // Reset choices, gambles, and responses for the next round
    game.choices = {};
    game.gambles = {};
    game.responses = {};

    // Increment the round counter or end the game if the max number of rounds is reached
    game.round += 1;
    if (game.round > game.maxRounds) {
        game.gameStarted = false;
        channel.send("Game over! Calculating final scores...");
        let maxPoints = -Infinity;
        let winner = null;
        Object.keys(game.points).forEach((playerId) => {
            if (game.points[playerId] > maxPoints) {
                maxPoints = game.points[playerId];
                winner = playerId;
            }
        });
        channel.send(
            `<@${winner}> wins the game with ${maxPoints} points!`
        );
    } else {
        sendItemListToPlayers(); // Send the item list for the next round
    }
}


client.login(token);
