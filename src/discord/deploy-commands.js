require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Ensure directory exists (might be empty initially)
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
        }
    }
}

const rest = new REST().setToken(process.env.token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        // Note: For global commands, use Routes.applicationCommands(clientId)
        // We'll use global for simplicity if clientId is available, or guild specific for specific test server.
        // Since we don't have clientId easily available without fetching it, we might need a separate setup or fetch it from client.

        // However, for this script to work standalone, we need CLIENT_ID.
        // Users usually don't have it in .env. We can ask user or fetch it in main app.
        // For now, I will make a function that Main App calls on ready.

        console.log("This script is intended to be called or used when CLIENT_ID is known.");

    } catch (error) {
        console.error(error);
    }
})();

module.exports = { commands }; // Export for use in main client
