const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const interactionHandler = require('./handlers/interactionHandler');

// Create Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

// Load Commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Events
client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    // Register commands incrementally to avoid "Entry Point" conflict
    try {
        console.log('Started refreshing application (/) commands.');

        // Register commands in bulk to avoid rate limiting
        await c.application.commands.set(client.commands.map(cmd => cmd.data));
        console.log(`Successfully reloaded ${client.commands.size} application (/) commands.`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on(Events.GuildCreate, async guild => {
    try {
        const owner = await guild.fetchOwner();
        const embed = {
            title: `Thanks for adding Gambler Bot! 🎲`,
            description: `Hello ${owner.user.username}! Thank you for inviting **Gambler Bot** to **${guild.name}**.\n\nWe hope your community enjoys the thrill of the gamble!\nTo get started, type \`/help\` in your server.\n\n**Support Development**\nIf you love the bot, consider supporting us:\n[Donate via PayPal](https://paypal.me/kujo4jotaro)`,
            color: 0xFFD700
        };
        await owner.send({ embeds: [embed] });
        console.log(`Sent welcome DM to owner of ${guild.name}`);
    } catch (error) {
        console.error(`Could not send welcome DM to owner of ${guild.name}:`, error);
    }
});

client.on('interactionCreate', interactionHandler.execute);

module.exports = client;
