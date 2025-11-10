/**
 * Mafia Game State Management - Platform-agnostic
 * Handles game storage, player tracking, and game lifecycle
 */

class LimitedMap extends Map {
    constructor(maxSize) {
        super();
        this.maxSize = maxSize;
    }

    set(key, value) {
        if (this.size >= this.maxSize && !this.has(key)) {
            console.warn(`LimitedMap reached max size of ${this.maxSize}`);
            return this;
        }
        return super.set(key, value);
    }
}

// Game state storage
const activeGames = new LimitedMap(5);
const playerGameMap = new LimitedMap(100);

/**
 * Create a new game
 * @param {string} gameId - Unique game identifier
 * @param {Array} players - Array of player objects
 * @param {string} organizerId - ID of game organizer
 * @param {Object} options - Game options
 * @returns {Object} Game object
 */
function createGame(gameId, players, organizerId, options = {}) {
    // Check if there's a Werebee in the game
    const hasWerebee = players.some(p => p.role === 'WEREBEE');

    const game = {
        id: gameId,
        organizerId: organizerId,
        players: players,
        phase: 'setup',
        phaseEndTime: null,
        nightActions: {},
        nightResults: [],
        visits: {},
        votes: {},
        zombeeVotes: {},
        phaseTimer: null,
        warningTimer: null,
        lastActivityTime: Date.now(),
        framedPlayers: new Set(),
        dousedPlayers: new Set(),
        deceivedPlayers: new Set(),
        blackmailedPlayers: new Set(),
        hypnotizedPlayers: new Set(),
        sabotagedPlayers: new Set(),
        silencedPlayers: new Set(),
        kidnappedPlayers: new Map(),
        nightNumber: 0,
        nightHistory: [],
        revivals: [],
        transports: [],
        beekeeperProtection: null,
        activeSeances: [],
        hasWerebee: hasWerebee,
        isFullMoon: false,
        ...options
    };

    activeGames.set(gameId, game);
    players.forEach(p => playerGameMap.set(p.id, gameId));

    return game;
}

/**
 * Get game by ID
 */
function getGame(gameId) {
    return activeGames.get(gameId);
}

/**
 * Get game by player ID
 */
function getGameByPlayer(playerId) {
    const gameId = playerGameMap.get(playerId);
    return gameId ? activeGames.get(gameId) : null;
}

/**
 * Delete a game and clean up
 */
function deleteGame(gameId) {
    const game = activeGames.get(gameId);
    if (game) {
        if (game.phaseTimer) clearTimeout(game.phaseTimer);
        if (game.warningTimer) clearTimeout(game.warningTimer);
        game.players.forEach(p => playerGameMap.delete(p.id));
        activeGames.delete(gameId);
    }
}

/**
 * Get all active games
 */
function getAllGames() {
    return activeGames;
}

/**
 * Add a visit to the tracking system
 */
function addVisit(game, visitorId, targetId) {
    if (game.kidnappedPlayers && game.kidnappedPlayers.has(targetId)) {
        return;
    }
    if (!game.visits[targetId]) {
        game.visits[targetId] = [];
    }
    if (!game.visits[targetId].includes(visitorId)) {
        game.visits[targetId].push(visitorId);
    }
}

/**
 * Get all visitors to a target
 */
function getVisitors(game, targetId) {
    return game.visits[targetId] || [];
}

/**
 * Clear nightly data
 */
function clearNightData(game) {
    game.nightActions = {};
    game.visits = {};
    game.nightResults = [];
    game.zombeeVotes = {};
    game.framedPlayers.clear();
    game.activeSeances = [];

    if (game.blackmailedPlayers) game.blackmailedPlayers.clear();
    if (game.deceivedPlayers) game.deceivedPlayers.clear();
    if (game.hypnotizedPlayers) game.hypnotizedPlayers.clear();
    if (game.sabotagedPlayers) game.sabotagedPlayers.clear();
    if (game.silencedPlayers) game.silencedPlayers.clear();

    game.players.forEach(p => {
        if (p.mimickedRole) delete p.mimickedRole;
        if (p.jailedTarget) delete p.jailedTarget;
    });

    if (game.revivals) game.revivals = [];
    if (game.beekeeperProtection) game.beekeeperProtection = null;
    if (game.transports) game.transports = [];

    if (game.kidnappedPlayers) {
        for (const [playerId, kidnapInfo] of game.kidnappedPlayers.entries()) {
            if (kidnapInfo.releaseNight <= game.nightNumber) {
                game.kidnappedPlayers.delete(playerId);
            }
        }
    }
}

/**
 * Clear voting data
 */
function clearVotes(game) {
    game.votes = {};
}

/**
 * Update last activity time
 */
function updateActivity(game) {
    game.lastActivityTime = Date.now();
}

module.exports = {
    createGame,
    getGame,
    getGameByPlayer,
    deleteGame,
    getAllGames,
    addVisit,
    getVisitors,
    clearNightData,
    clearVotes,
    updateActivity
};
