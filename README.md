# Gambler-bot

Gambler-bot is a Discord bot that hosts a multiplayer gambling game where players choose items, decide whether to gamble them, and compete for points. It tests your strategy and risk-taking abilities!

## 🎮 Game Rules

The game consists of a series of rounds (6-10). In each round:
1.  **Item Selection**: Players receive a list of items via DM, each with a specific price.
2.  **Choose**: Players choose one item from the list.
3.  **Gamble**: Players decided whether to "Gamble" with their chosen item or play it safe.

### Scoring & mechanics
*   **The Goal**: Be the player with the most points after all rounds are completed.
*   **Gambling Outcome**:
    *   The system looks for the **highest-priced item** that was gambled by **exactly one player**.
    *   **Winner**: The player with this unique high-value item gains **+1 point**.
    *   **Losers**: All other players who gambled (and didn't win) lose **-1 point**.
    *   **Safe Players**: Players who chose "No" to gambling receive **0 points**.
*   **Item Burn**: Once you gamble with an item (whether you win or lose), that item is **burned** (crossed out) for you. You cannot choose it again in future rounds. Choose your moments wisely!
*   **Timers**: A round automatically ends **5 seconds** after the *last* player makes their gambling decision.
*   **Elimination**: Players who drop to **-3 points** are immediately eliminated from the game.
*   **Winning**: The game ends after the set number of rounds. The player with the highest score wins.
    *   **Tie-Breakers**:
        1.  Fewest items burned.
        2.  Lowest total value of burned items.
        3.  Shared victory if still tied.

## 🚀 Commands (Slash Commands)

### Host/Admin Commands
*   `/hostgame [rounds]`: Host a new game (e.g., `/hostgame rounds:8`).
*   `/startgame`: Start the game (Host only).

### Player Commands
*   `/join`: Join the current lobby.
*   `/choose [item-id]`: (DM Only) Choose an item by its ID.
*   `/stats`: View current points and status.

## 🛠️ Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd Gambler-bot
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file in the root directory and add your discord bot token:
    ```env
    token=YOUR_DISCORD_BOT_TOKEN
    ```

4.  **Run the Bot**:
    ```bash
    node index.js
    ```
    *Note: Slash commands may take up to an hour to register globally, but are instant for the guild you develop in.*

## 🔗 Inviting the Bot
To add the bot to your Discord server:

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Click on your application.
3.  Go to **OAuth2** -> **URL Generator** in the left sidebar.
4.  Under **Scopes**, check:
    *   `bot`
    *   `applications.commands` (**Required** for Slash Commands)
5.  Under **Bot Permissions**, check:
    *   `Send Messages`
    *   `Embed Links`
    *   `Read Message History`
    *   `View Channels`
6.  Copy the **Generated URL** at the bottom.
7.  Paste the URL into your browser, select your server, and click **Authorize**.

## 📦 Items List

| ID | Item Name | Price |
| :--- | :--- | :--- |
| 1 | Notebook | $5 |
| 2 | Coffee Mug | $10 |
| 3 | Wireless Mouse | $20 |
| 4 | Bluetooth Speaker | $50 |
| 5 | Portable Power Bank | $70 |
| 6 | AirPods | $150 |
| 7 | Smartwatch | $300 |
| 8 | Laptop | $800 |
| 9 | iPhone | $1000 |
