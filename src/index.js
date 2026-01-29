require('dotenv').config();
const client = require('./discord/client');

const token = process.env.token;

if (!token) {
    console.error("Error: Token not found in .env file.");
    process.exit(1);
}

client.login(token);
