const ITEMS = require('./Items');

class Player {
    constructor(id, username) {
        this.id = id;
        this.username = username;
        this.points = 0;
        this.inventory = [...ITEMS]; // Copy of all items
        this.burned = new Set(); // Set of item IDs (numbers)
        this.currentChoice = null; // Item object or ID
        this.currentGamble = null; // true, false, or null
        this.eliminated = false;
        this.isAfk = false;
    }

    resetRoundState() {
        this.currentChoice = null;
        this.currentGamble = null;
    }

    hasBurned(itemId) {
        return this.burned.has(itemId);
    }

    burnItem(itemId) {
        this.burned.add(itemId);
        // Remove from inventory for convenience, though checking 'burned' set is safer source of truth
        this.inventory = this.inventory.filter(i => i.id !== itemId);
    }
}

module.exports = Player;
