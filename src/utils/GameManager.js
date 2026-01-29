class GameManager {
    constructor() {
        this.games = new Map(); // Map<channelId, Game>
        this.playerGameMap = new Map(); // Map<playerId, channelId> - quick lookup for players
    }

    createGame(channelId, game) {
        if (this.games.has(channelId)) {
            throw new Error("A game is already running in this channel.");
        }
        this.games.set(channelId, game);
    }

    getGame(channelId) {
        return this.games.get(channelId);
    }

    getGameByPlayer(playerId) {
        const channelId = this.playerGameMap.get(playerId);
        return channelId ? this.games.get(channelId) : null;
    }

    addPlayerToGame(playerId, channelId) {
        this.playerGameMap.set(playerId, channelId);
    }

    removeGame(channelId) {
        const game = this.games.get(channelId);
        if (game) {
            // Cleanup player map
            for (const playerId of game.players.keys()) {
                this.playerGameMap.delete(playerId);
            }
            this.games.delete(channelId);
        }
    }
}

// Singleton instance
module.exports = new GameManager();
