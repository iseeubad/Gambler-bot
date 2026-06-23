require('dotenv').config();
const client = require('./discord/client');

const token = process.env.token;

if (!token) {
    console.error("Error: Token not found in .env file.");
    process.exit(1);
}

client.login(token);

// Top.gg AutoPoster
if (process.env.TOPGG_TOKEN) {
    const { AutoPoster } = require('topgg-autoposter');
    const ap = AutoPoster(process.env.TOPGG_TOKEN, client);

    ap.on('posted', () => {
        console.log('Posted stats to Top.gg!');
    });

    ap.on('error', (err) => {
        console.error('Top.gg AutoPoster Error:', err);
    });
} else {
    console.log('No TOPGG_TOKEN found (skipping Top.gg stats posting).');
}
