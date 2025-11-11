/**
 * Mafia Game Utility Functions - Platform-agnostic
 * Helper functions for role distribution, team counting, win conditions, etc.
 */

const { ROLES } = require('../roles');

/**
 * Get a player's actual team (respecting conversions)
 */
function getPlayerTeam(player) {
    if (player.originalTeam) {
        return player.originalTeam;
    }
    return ROLES[player.role].team;
}

/**
 * Get role distribution based on player count
 */
function getRoleDistribution(playerCount, randomMode = false, debugMode = false) {
    const distribution = [];

    // Minimum players check
    const minPlayers = debugMode ? 2 : 6;
    if (playerCount < minPlayers) {
        return null;
    }

    // Use simplified role setup from new roles.js
    const { getRoleSetup } = require('../roles');

    // For debug mode or small games, use predefined setups
    if (debugMode || playerCount <= 15) {
        const gameMode = randomMode ? 'chaos' : 'basic';
        return getRoleSetup(gameMode, playerCount);
    }

    // For larger games, calculate distribution manually
    let waspCount;
    if (playerCount === 6) {
        waspCount = 2;
    } else if (playerCount >= 7 && playerCount <= 9) {
        waspCount = 2;
    } else if (playerCount >= 10 && playerCount <= 13) {
        waspCount = 3;
    } else if (playerCount >= 14 && playerCount <= 16) {
        waspCount = 4;
    } else {
        waspCount = Math.floor(playerCount * 0.3);
    }

    const neutralCount = playerCount >= 8 ? Math.min(2, Math.floor(playerCount * 0.15)) : 0;
    const beeCount = playerCount - waspCount - neutralCount;

    // WASP ROLES
    if (waspCount >= 1) distribution.push('WASP_DRONE');
    if (waspCount >= 2) distribution.push('WASP_DRONE');
    if (waspCount >= 3 && playerCount >= 10) {
        distribution.push('WASP_INFILTRATOR');
    }
    if (waspCount >= 4 && playerCount >= 14) {
        distribution.push('WASP_QUEEN');
    }

    // Fill remaining wasp slots
    for (let i = distribution.length; i < waspCount; i++) {
        distribution.push('WASP_DRONE');
    }

    // NEUTRAL ROLES
    const neutralRoles = ['JESTER_BEE', 'SURVIVOR_BEE'];
    for (let i = 0; i < neutralCount; i++) {
        const randomNeutral = neutralRoles[i % neutralRoles.length];
        distribution.push(randomNeutral);
    }

    // BEE ROLES
    const beeRoles = [];

    // Core bee roles
    if (beeCount >= 1) beeRoles.push('SCOUT_BEE');
    if (beeCount >= 2) beeRoles.push('NURSE_BEE');
    if (beeCount >= 3) beeRoles.push('GUARD_BEE');

    // Additional scouts/nurses for larger games
    if (beeCount >= 8) beeRoles.push('SCOUT_BEE');
    if (beeCount >= 10) beeRoles.push('NURSE_BEE');

    // Fill remaining with worker bees
    while (beeRoles.length < beeCount) {
        beeRoles.push('WORKER_BEE');
    }

    distribution.push(...beeRoles);
    return distribution;
}

/**
 * Shuffle an array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get team counts
 */
function getTeamCounts(game) {
    const alive = game.players.filter(p => p.alive);
    const wasps = alive.filter(p => getPlayerTeam(p) === 'wasp').length;
    const bees = alive.filter(p => getPlayerTeam(p) === 'bee').length;
    const zombees = alive.filter(p => getPlayerTeam(p) === 'zombee').length;
    const neutralKilling = alive.filter(p => getPlayerTeam(p) === 'neutral' && ROLES[p.role].subteam === 'killing').length;
    const neutralEvil = alive.filter(p => getPlayerTeam(p) === 'neutral' && ROLES[p.role].subteam === 'evil').length;
    const neutralBenign = alive.filter(p => getPlayerTeam(p) === 'neutral' && ROLES[p.role].subteam === 'benign').length;

    return {
        wasps,
        bees,
        zombees,
        neutralKilling,
        neutralEvil,
        neutralBenign,
        total: alive.length
    };
}

/**
 * Count votes
 */
function countVotes(votes) {
    const voteCounts = {};
    Object.values(votes).forEach(targetId => {
        if (targetId !== 'skip') {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
    });
    return voteCounts;
}

/**
 * Determine winners based on win type
 */
function determineWinners(game, winnerType, specificWinner = null) {
    const winners = [];

    game.players.forEach(player => {
        const role = ROLES[player.role];
        const team = getPlayerTeam(player);

        if (winnerType === 'bees' && team === 'bee') {
            winners.push(player);
        } else if (winnerType === 'wasps' && team === 'wasp') {
            winners.push(player);
        } else if (winnerType === 'zombees' && team === 'zombee') {
            winners.push(player);
        } else if (winnerType === 'neutral_killer' && player.id === specificWinner?.id) {
            winners.push(player);
        } else if (winnerType === 'jester' && player.id === specificWinner?.id) {
            winners.push(player);
        } else if (winnerType === 'executioner' && player.id === specificWinner?.id) {
            winners.push(player);
        }

        // Survivors win with anyone (if alive)
        if (player.alive && (player.role === 'BUTTERFLY')) {
            if (!winners.includes(player)) {
                winners.push(player);
            }
        }

        // Gossip Beetle wins with anyone (if alive)
        if (player.alive && player.role === 'GOSSIP_BEETLE') {
            if (!winners.includes(player)) {
                winners.push(player);
            }
        }

        // Guardian Ant wins if alive and their target wins
        if (player.alive && player.role === 'GUARDIAN_ANT' && player.guardianTarget) {
            const target = game.players.find(p => p.id === player.guardianTarget);
            if (target && winners.includes(target)) {
                if (!winners.includes(player)) {
                    winners.push(player);
                }
            }
        }

        // Matchmaker Beetle wins if alive and their linked partner wins
        if (player.alive && player.role === 'MATCHMAKER_BEETLE' && player.linkedPartner) {
            const partner = game.players.find(p => p.id === player.linkedPartner);
            if (partner && winners.includes(partner)) {
                if (!winners.includes(player)) {
                    winners.push(player);
                }
            }
        }

        // Spider wins if they're alive and sees bees or wasps lose
        if (player.alive && player.role === 'SPIDER') {
            if (winnerType === 'neutral_killer' || (winnerType === 'wasps' && team !== 'bee') || (winnerType === 'bees' && team !== 'wasp')) {
                if (!winners.includes(player)) {
                    winners.push(player);
                }
            }
        }
    });

    return winners;
}

/**
 * Check win conditions
 */
function checkWinConditions(game) {
    const { wasps, bees, zombees, neutralKilling, neutralEvil, total } = getTeamCounts(game);

    // Zombees win if they achieve majority or all players are zombees
    if (zombees > 0 && zombees >= (wasps + bees + neutralKilling + neutralEvil)) {
        return { type: 'zombees' };
    }

    // Single neutral killer wins (but not if zombees present)
    if (total === 1 && neutralKilling === 1 && zombees === 0) {
        const winner = game.players.find(p => p.alive && ROLES[p.role].subteam === 'killing');
        return { type: 'neutral_killer', winner };
    }

    // Wasps win if they achieve parity (but not if zombees present)
    if (wasps > 0 && zombees === 0 && wasps >= (bees + neutralKilling + neutralEvil)) {
        return { type: 'wasps' };
    }

    // Bees win if wasps, zombees, and neutral killing are all eliminated
    if (wasps === 0 && zombees === 0 && neutralKilling === 0) {
        return { type: 'bees' };
    }

    return null;
}

/**
 * Initialize player role-specific data
 */
function initializePlayerRole(player, roleKey) {
    const roleInfo = ROLES[roleKey];

    // Check if role exists - if not, assign WORKER_BEE as fallback
    if (!roleInfo) {
        console.error(`⚠️ Role not found: ${roleKey} - Assigning WORKER_BEE as fallback`);
        player.role = 'WORKER_BEE';
        return;
    }

    player.role = roleKey;

    // Safe initialization with optional chaining
    if (roleInfo.bullets !== undefined) player.bullets = roleInfo.bullets;
    if (roleInfo.vests !== undefined || roleInfo.vestsRemaining !== undefined) {
        player.vests = roleInfo.vests || roleInfo.vestsRemaining;
    }
    if (roleInfo.selfHealsLeft !== undefined) player.selfHealsLeft = roleInfo.selfHealsLeft;
    if (roleInfo.executions !== undefined) player.executions = roleInfo.executions;
    if (roleInfo.alerts !== undefined) player.alerts = roleInfo.alerts;
    if (roleInfo.cleans !== undefined) player.cleans = roleInfo.cleans;
    if (roleInfo.disguises !== undefined) player.disguises = roleInfo.disguises;
    if (roleInfo.hasRemembered !== undefined) player.hasRemembered = roleInfo.hasRemembered;

    // Special role initialization
    if (roleKey === 'MERCENARY') {
        player.mercenaryTeam = Math.random() < 0.5 ? 'bee' : 'wasp';
    }
}

// Game constants
const GAME_CONSTANTS = {
    MIN_PLAYERS: 6,
    MIN_PLAYERS_DEBUG: 1, // Debug mode allows single player testing with bots
    SETUP_DELAY: 30000,
    SETUP_DELAY_DEBUG: 10000,
    DUSK_DURATION: 30000, // 30 seconds for dusk actions (Jailer, Pirate, etc.)
    DUSK_DURATION_DEBUG: 20000, // 20 seconds in debug mode
    NIGHT_DURATION: 60000,
    NIGHT_DURATION_DEBUG: 45000,
    DAY_DISCUSSION_DURATION: 180000,
    DAY_DISCUSSION_DURATION_DEBUG: 90000,
    VOTING_DURATION: 120000,
    VOTING_DURATION_DEBUG: 60000,
    GAME_INACTIVITY_TIMEOUT: 3600000,
    WINNER_REWARD: 500
};

// Helper to get constants based on debug mode
function getGameConstants(debugMode = false) {
    return {
        MIN_PLAYERS: debugMode ? GAME_CONSTANTS.MIN_PLAYERS_DEBUG : GAME_CONSTANTS.MIN_PLAYERS,
        SETUP_DELAY: debugMode ? GAME_CONSTANTS.SETUP_DELAY_DEBUG : GAME_CONSTANTS.SETUP_DELAY,
        DUSK_DURATION: debugMode ? GAME_CONSTANTS.DUSK_DURATION_DEBUG : GAME_CONSTANTS.DUSK_DURATION,
        NIGHT_DURATION: debugMode ? GAME_CONSTANTS.NIGHT_DURATION_DEBUG : GAME_CONSTANTS.NIGHT_DURATION,
        DAY_DISCUSSION_DURATION: debugMode ? GAME_CONSTANTS.DAY_DISCUSSION_DURATION_DEBUG : GAME_CONSTANTS.DAY_DISCUSSION_DURATION,
        VOTING_DURATION: debugMode ? GAME_CONSTANTS.VOTING_DURATION_DEBUG : GAME_CONSTANTS.VOTING_DURATION,
        GAME_INACTIVITY_TIMEOUT: GAME_CONSTANTS.GAME_INACTIVITY_TIMEOUT,
        WINNER_REWARD: GAME_CONSTANTS.WINNER_REWARD
    };
}

module.exports = {
    getPlayerTeam,
    getRoleDistribution,
    shuffleArray,
    getTeamCounts,
    countVotes,
    determineWinners,
    checkWinConditions,
    initializePlayerRole,
    GAME_CONSTANTS,
    getGameConstants
};
