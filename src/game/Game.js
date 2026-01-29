const EventEmitter = require('events');
const Player = require('./Player');
const ITEMS = require('./Items');

const GameState = {
    LOBBY: 'LOBBY',
    IN_ROUND: 'IN_ROUND',
    ROUND_RESULTS: 'ROUND_RESULTS',
    GAME_OVER: 'GAME_OVER'
};

class Game extends EventEmitter {
    constructor(hostId, channelId, maxRounds = 6) {
        super();
        this.hostId = hostId;
        this.channelId = channelId;
        this.maxRounds = Math.min(Math.max(maxRounds, 6), 10); // Clamp between 6 and 10
        this.round = 0;
        this.state = GameState.LOBBY;
        this.players = new Map(); // Map<string, Player>
        this.pendingEndRoundTimer = null;
        this.roundTimers = new Set();
    }

    /**
     * @param {string} id 
     * @param {string} username 
     */
    addPlayer(id, username) {
        if (this.state !== GameState.LOBBY) throw new Error("Game already started.");
        if (this.players.has(id)) throw new Error("Player already joined.");

        this.players.set(id, new Player(id, username));
        return this.players.size;
    }

    start() {
        if (this.players.size < 2) { // Allow 2 for testing, though user said 5 effectively
            throw new Error("Not enough players to start.");
        }
        this.state = GameState.IN_ROUND;
        this.nextRound();
    }

    nextRound() {
        this.round++;
        if (this.round > this.maxRounds) {
            this.endGame();
            return;
        }

        this.state = GameState.IN_ROUND;
        // Reset player round states
        for (const player of this.players.values()) {
            if (!player.eliminated) {
                player.resetRoundState();
                // If they were pending rejoin, now they are back
                // For this logic, we assume user calls rejoin() mid-round, setting afk=false effectively for next round usage
                // But we said "next round", so if we set it false immediately, they get DMs immediately?
                // The plan said: mark pendingRejoin, officially rejoin at nextRound.
                if (player.pendingRejoin) {
                    player.pendingRejoin = false;
                    player.isAfk = false;
                }
            }
        }

        // 2 Minute Timer for AFK
        // Clear previous if any
        this.clearRoundTimers();

        this.emit('roundStart', { round: this.round, players: Array.from(this.players.values()) });

        // Timer Logic
        const totalTime = 120000; // 2 minutes
        const warnings = [60, 30, 10, 3, 2, 1]; // Seconds remaining to warn at

        // Schedule Warnings
        warnings.forEach(sec => {
            const delay = totalTime - (sec * 1000);
            if (delay > 0) {
                const t = setTimeout(() => {
                    this.emit('roundTimeWarning', sec);
                }, delay);
                this.roundTimers.add(t);
            }
        });

        // Schedule End
        this.pendingEndRoundTimer = setTimeout(() => {
            this.handleRoundTimeout();
        }, totalTime);
    }

    clearRoundTimers() {
        if (this.pendingEndRoundTimer) {
            clearTimeout(this.pendingEndRoundTimer);
            this.pendingEndRoundTimer = null;
        }
        for (const t of this.roundTimers) {
            clearTimeout(t);
        }
        this.roundTimers.clear();
    }

    /**
     * @param {string} playerId 
     * @param {number} itemIndex 1-based index from user input or item ID? Let's assume ID for internal, but handle lookup.
     */
    chooseItem(playerId, itemIndex) {
        const player = this.players.get(playerId);
        if (!player) throw new Error("Player not found.");
        if (player.eliminated) throw new Error("You are eliminated.");
        if (this.state !== GameState.IN_ROUND) throw new Error("Not in round.");
        if (player.currentChoice) throw new Error("Already chosen.");

        const item = ITEMS.find(i => i.id === itemIndex);
        if (!item) throw new Error("Invalid item.");
        if (player.hasBurned(item.id)) throw new Error("Item already burned.");

        player.currentChoice = item;
        return item;
    }

    /**
     * @param {string} playerId 
     * @param {boolean} gambleDecision 
     */
    setGamble(playerId, gambleDecision) {
        const player = this.players.get(playerId);
        if (!player) throw new Error("Player not found.");
        if (player.eliminated) throw new Error("You are eliminated.");
        if (!player.currentChoice) throw new Error("You must choose an item first.");

        player.currentGamble = gambleDecision;

        // Remove 'button interactions' if needed handled by Discord layer via event
        this.emit('playerGamble', { playerId, decision: gambleDecision });

        this.checkRoundCompletion();
    }

    handleRoundTimeout() {
        if (this.state !== GameState.IN_ROUND) return;

        const newAfkPlayers = [];

        for (const player of this.players.values()) {
            if (!player.eliminated && !player.isAfk && !player.currentChoice) {
                player.isAfk = true;
                newAfkPlayers.push(player);
            }
        }

        if (newAfkPlayers.length > 0) {
            this.emit('playersAfk', newAfkPlayers);
        }

        // Proceed to resolve round immediately as time is up
        this.resolveRound();
    }

    checkRoundCompletion() {
        const activePlayers = Array.from(this.players.values()).filter(p => !p.eliminated && !p.isAfk);
        const allDecided = activePlayers.every(p => p.currentGamble !== null);

        // If everyone is AFK/Eliminated, forcing next round via timer or just ending?
        // If activePlayers is empty, allDecided is true.

        if (allDecided) {
            // Cancel existing timer (the 2 min one) and warnings
            this.clearRoundTimers();

            // Start 5s timer for transition
            this.pendingEndRoundTimer = setTimeout(() => {
                this.resolveRound();
            }, 5000);

            this.emit('roundTimerStart', 5000);
        }
    }

    resolveRound() {
        this.state = GameState.ROUND_RESULTS;
        this.pendingEndRoundTimer = null;

        const roundLog = []; // To track what happened
        const activePlayers = Array.from(this.players.values()).filter(p => !p.eliminated && !p.isAfk);

        // Group decisions
        const gambles = activePlayers.filter(p => p.currentGamble === true);

        // Count occurrences of each item being gambled
        const itemCounts = {};
        gambles.forEach(p => {
            const itemId = p.currentChoice.id;
            itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
        });

        // Determine outcome for each player
        let winnerId = null;
        let highestUniquePrice = -1;

        // Find unique gambles
        for (const [itemId, count] of Object.entries(itemCounts)) {
            if (count === 1) {
                const item = ITEMS.find(i => i.id == itemId); // items.js uses numbers
                if (item.price > highestUniquePrice) {
                    highestUniquePrice = item.price;
                    // Find the player who did this
                    const winner = gambles.find(p => p.currentChoice.id == itemId);
                    winnerId = winner.id;
                }
            }
        }

        // Apply scores and Item Burn for ACTIVE players
        activePlayers.forEach(p => {
            let result = "SAFE";
            if (p.currentGamble === true) {
                // BURN ITEM
                p.burnItem(p.currentChoice.id);

                if (p.id === winnerId) {
                    p.points += 1;
                    result = "WIN";
                } else {
                    p.points -= 1;
                    result = "LOSS";
                }
            }
            roundLog.push({
                playerId: p.id,
                username: p.username,
                choice: p.currentChoice,
                gamble: p.currentGamble,
                result,
                isAfk: false
            });
        });

        // Apply Penalty to AFK Players
        const afkPlayers = Array.from(this.players.values()).filter(p => !p.eliminated && p.isAfk);
        afkPlayers.forEach(p => {
            p.points -= 1;
            roundLog.push({
                playerId: p.id,
                username: p.username,
                choice: null,
                gamble: null,
                result: "AFK",
                isAfk: true
            });
        });

        // Eliminate players
        this.players.forEach(p => {
            if (p.points <= -3 && !p.eliminated) {
                p.eliminated = true;
                roundLog.push({ playerId: p.id, username: p.username, event: "ELIMINATED" });
            }
        });

        this.emit('roundEnded', { roundLog, winnerId });

        // Check for Game Over condition: Only 1 or 0 active players left
        // Active = !eliminated AND !isAfk
        // HOWEVER: If a player is AFK, they theoretically might rejoin?
        // Requirement: "applied in the case where all the players are afk or only one left"
        // So strict check on active players.
        const remainingActive = Array.from(this.players.values()).filter(p => !p.eliminated && !p.isAfk);

        if (remainingActive.length <= 1) {
            // If we have <=1 active, we end the game.
            // But wait, if we end immediately, we need to make sure the "Round Results" are seen?
            // usually frontend shows round results, then game over screen.
            // We'll call endGame().
            setTimeout(() => this.endGame(), 1000); // Small delay to allow roundEnded to process first
            return;
        }

        // Wait a bit before next round? Or wait for host?
        // Let's auto-proceed after a delay or waiting for "Next" command.
        // For simplicity, let's auto-proceed after 10s or wait for host command.
        // User asked for state machine, usually expects manual or auto flow.
        // I'll emit event, Discord layer can trigger nextRound() after delay.
    }

    rejoinPlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) throw new Error("Player not found.");
        if (player.eliminated) throw new Error("You are eliminated and cannot rejoin.");
        if (!player.isAfk) throw new Error("You are not AFK.");

        player.pendingRejoin = true;
        // They will be set isAfk = false at the start of NEXT round in nextRound()
    }

    endGame() {
        this.clearRoundTimers();
        this.state = GameState.GAME_OVER;

        // Calculate winner
        const players = Array.from(this.players.values());

        // Sort by points desc, then fewest burned items, then lowest burned value
        players.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (a.burned.size !== b.burned.size) return a.burned.size - b.burned.size;

            // Calculate burned value
            const aBurnVal = Array.from(a.burned).reduce((sum, id) => sum + (ITEMS.find(i => i.id === id)?.price || 0), 0);
            const bBurnVal = Array.from(b.burned).reduce((sum, id) => sum + (ITEMS.find(i => i.id === id)?.price || 0), 0);
            return aBurnVal - bBurnVal;
        });

        // Check for shared victory (exact tie on all criteria)
        const winner = players[0];
        const ties = players.filter(p =>
            p.points === winner.points &&
            p.burned.size === winner.burned.size &&
            this.getBurnValue(p) === this.getBurnValue(winner)
        );

        this.emit('gameEnded', { winners: ties, leaderboard: players });
    }

    getBurnValue(player) {
        return Array.from(player.burned).reduce((sum, id) => sum + (ITEMS.find(i => i.id === id)?.price || 0), 0);
    }
}

module.exports = { Game, GameState };
