const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
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
            return message.channel.send(`You chose ${item.name}`);
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
        if (game.players.length < 5) {
            message.channel.send(
                "Not enough players to start the game. Minimum 5 players required.",
            );
            return;
        }
        // Create an embed with the list of items
        const itemListEmbed = new EmbedBuilder()
            .setTitle("Choose Your Item")
            .setDescription(
                "Please choose an item for this round by responding with the item number.",
            )
            .setColor("#0099ff");

        game.items.forEach((item, index) => {
            itemListEmbed.addFields({
                name: `${index + 1}. ${item.name}`,
                value: `$${item.price}`,
                inline: true,
            });
        });

        // Send the embed to all players who joined the game
        for (let playerId of game.players) {
            client.users.fetch(playerId).then((user) => {
                user.send({ embeds: [itemListEmbed] })
                    .then(() => console.log(`Sent DM to ${user.username}`))
                    .catch(console.error);
            });
        }

        // Start the game
        game.gameStarted = true;
        game.lobbyOpen = false;
        game.round = 1;
        game.players.forEach((player) => {
            game.points[player] = 0;
        });
        message.channel.send(`Game started! Round ${game.round} the item list has been sent to all players. Use !choose <item_index> to choose an item.`);
    }

    /*if (command === 'choose') {
        if (!game.gameStarted) {
            message.channel.send('No game in progress.');
            return;
        }
        if (!game.players.includes(message.author.id)) {
            message.channel.send('You are not a player in this game.');
            return;
        }
        const itemName = args.join(' ');
        const item = game.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!item) {
            message.channel.send('Invalid item.');
            return;
        }
        if (game.usedItems[message.author.id] && game.gambledItems[message.author.id].includes(item.name)) {
        return message.channel.send('You have already used this item.');
        }
        game.choices[message.author.id] = item;
        message.author.send(`You chose ${item.name}`);
    }*/



    if (command === "gamble") {
        if (!game.gameStarted) {
            message.channel.send("No game in progress.");
            return;
        }
        if (!game.players.includes(message.author.id)) {
            message.channel.send("You are not a player in this game.");
            return;
        }
        if (!game.choices[message.author.id]) {
            message.channel.send("You must choose an item first.");
            return;
        }

        game.gambles[message.author.id] = true;
        const chosenItem = game.choices[message.author.id];
        if (!game.gambledItems[message.author.id]) {
            game.gambledItems[message.author.id] = [];
        }

        game.gambles[message.author.id] = true;
        game.gambledItems[message.author.id].push(chosenItem.name);
        message.author.send("You chose to gamble.");
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

        // End the current round, calculate points
        let maxPrice = 0;
        let mostExpensiveItem = null;
        let gambledChoices = {};

        // Filter out players who didn't gamble
        Object.keys(game.gambles).forEach(playerId => {
            if (game.gambles[playerId] && game.choices[playerId]) {
                gambledChoices[playerId] = game.choices[playerId];
            }
        });

        Object.values(gambledChoices).forEach(item => {
            if (item.price > maxPrice) {
                maxPrice = item.price;
                mostExpensiveItem = item;
            }
        });

        const mostExpensivePlayers = Object.keys(gambledChoices).filter(
            playerId => gambledChoices[playerId].price === maxPrice
        );

        if (mostExpensivePlayers.length > 1) {
            // Multiple players with the most expensive item
            message.channel.send(
                "Multiple players have the most expensive item. No points awarded."
            );
        } else if (mostExpensivePlayers.length === 1) {
            const winnerId = mostExpensivePlayers[0];
            game.points[winnerId] = (game.points[winnerId] || 0) + 1;
            message.channel.send(
                `<@${winnerId}> gains +1 point for choosing the ${gambledChoices[winnerId].name} item, which happens to be the most expensive.`
            );

            Object.keys(gambledChoices).forEach(playerId => {
                if (playerId !== winnerId) {
                    game.points[playerId] = (game.points[playerId] || 0) - 1;
                    const lostItem = game.choices[playerId].name;
                    message.channel.send(
                        `<@${playerId}> gambled with ${lostItem} and loses -1 point.`
                    );
                }
            });
        } else {
            message.channel.send("No players gambled this round. No points awarded.");
        }

        // Eliminate players with -3 or fewer points
        const eliminatedPlayers = [];
        game.players = game.players.filter((playerId) => {
            if (game.points[playerId] <= -3) {
                eliminatedPlayers.push(playerId);
                return false;
            }
            return true;
        });

        if (eliminatedPlayers.length > 0) {
            eliminatedPlayers.forEach((playerId) => {
                message.channel.send(
                    `<@${playerId}> has been eliminated with ${game.points[playerId]} points.`,
                );
            });
        }

        // Reset choices and gambles for the next round
        game.choices = {};
        game.gambles = {};
    
        // Increment round or end game
        game.round += 1;
        if (game.round > game.maxRounds) {
            game.gameStarted = false;
            message.channel.send("Game over! Calculating final scores...");
            let maxPoints = -Infinity;
            let winner = null;
            Object.keys(game.points).forEach((playerId) => {
                if (game.points[playerId] > maxPoints) {
                    maxPoints = game.points[playerId];
                    winner = playerId;
                }
            });
            message.channel.send(
                `<@${winner}> wins the game with ${maxPoints} points!`,
            );
        } else {
            // Create an embed with the list of items
            const itemListEmbed = new EmbedBuilder()
                .setTitle("Choose Your Item")
                .setDescription(
                    "Please choose an item for this round by responding with the item number.",
                )
                .setColor("#0099ff");
    
            game.items.forEach((item, index) => {
                itemListEmbed.addFields({
                    name: `${index + 1}. ${item.name}`,
                    value: `$${item.price}`,
                    inline: true,
                });
            });
    
            // Send the embed to all players who joined the game
            for (let playerId of game.players) {
                client.users.fetch(playerId).then((user) => {
                    user.send({ embeds: [itemListEmbed] })
                        .then(() => console.log(`Sent DM to ${user.username}`))
                        .catch(console.error);
                });
            }
            message.channel.send(`Round ${game.round} starts now! The item list has been sent to all players. Use !choose <item_index> to choose an item.`);
        }
    }
    if (command === 'points') {
        if (!game.gameStarted) {
            message.channel.send("No game in progress.");
            return;
        }

        let pointsEmbed = new EmbedBuilder()
            .setTitle('Player Points')
            .setColor('#0099ff');

        for (const playerId of Object.keys(game.points)) {
            const user = await client.users.fetch(playerId);
            const status = game.points[playerId] <= -3 ? "Eliminated" : "Playing";
            pointsEmbed.addFields({ name: user.username, value: `${game.points[playerId]} points (${status})`, inline: true });
        }

        message.channel.send({ embeds: [pointsEmbed] });
    }
    if (command === 'endgame') {
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
            .setColor('#0099ff');

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
        game.round = 0;
        game.numberPlayers = 0;
        game.host = null;
    }
});

client.login(token);
