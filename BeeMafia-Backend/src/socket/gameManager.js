/**
 * Game Manager
 * Handles game creation, lifecycle, and player actions
 */

const { createGame: createGameState, getGame, deleteGame, clearNightData, clearVotes } = require('../../../shared/game/gameState');
const { getRoleDistribution, shuffleArray, initializePlayerRole, checkWinConditions, determineWinners, getTeamCounts, countVotes, getGameConstants } = require('../../../shared/game/gameUtils');
const { ROLES } = require('../../../shared/roles');
const { RANDOM_ROLE_POOLS, resolveRandomRole } = require('../../../shared/game/roleCategories');
const { getPresetDistribution } = require('../../../shared/game/presets');
const { activePlayers, activeGameRooms, updateLobby } = require('./lobbyManager');
const { processNightActions } = require('./actionsProcessor');
const User = require('../../models/User');
const GameModel = require('../../models/Game');

// Helper function to generate unique 6-character room codes
function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Check if code already exists (unlikely but safe)
    const existingGame = Array.from(activeGameRooms.values()).find(g => g.roomCode === code);
    if (existingGame) {
        return generateRoomCode(); // Recursive call to generate new code
    }
    return code;
}

// Helper function to get phase duration (custom or default)
function getPhaseDuration(game, phase) {
    // If custom durations are provided, use them
    if (game.customDurations && game.customDurations[phase]) {
        return game.customDurations[phase] * 1000; // Convert seconds to milliseconds
    }

    // Otherwise use constants based on debug mode
    const constants = getGameConstants(game.debugMode);

    switch(phase) {
        case 'setup':
            return constants.SETUP_DELAY;
        case 'night':
            return constants.NIGHT_DURATION;
        case 'day':
            return constants.DAY_DISCUSSION_DURATION;
        case 'voting':
            return constants.VOTING_DURATION;
        default:
            return 60000; // Default 60 seconds
    }
}

// Bot AI Helper Functions with Intelligent Behavior
function performBotNightActions(game) {
    const alivePlayers = game.players.filter(p => p.alive);
    const bots = alivePlayers.filter(p => p.isBot);

    // Gather information for smart decision making
    const beeCount = alivePlayers.filter(p => ROLES[p.role].team === 'bee').length;
    const waspCount = alivePlayers.filter(p => ROLES[p.role].team === 'wasp').length;
    const neutralCount = alivePlayers.filter(p => ROLES[p.role].team === 'neutral').length;

    bots.forEach(bot => {
        const roleInfo = ROLES[bot.role];
        if (!roleInfo.nightAction) return;

        const validTargets = alivePlayers.filter(p => p.id !== bot.id);
        if (validTargets.length === 0) return;

        let target = null;
        const botTeam = roleInfo.team;

        // Smart targeting based on role (updated for Discord bot action types)
        switch (roleInfo.actionType) {
            case 'mafia_kill':
                // Wasps target non-wasps intelligently
                if (botTeam === 'wasp') {
                    // Priority: Investigators > Healers > Others
                    const nonWasps = validTargets.filter(p => ROLES[p.role].team !== 'wasp');
                    const investigators = nonWasps.filter(p => {
                        const type = ROLES[p.role].actionType;
                        return type === 'investigate_suspicious' || type === 'investigate_exact';
                    });
                    const healers = nonWasps.filter(p => ROLES[p.role].actionType === 'heal');

                    if (investigators.length > 0 && Math.random() < 0.7) {
                        target = investigators[Math.floor(Math.random() * investigators.length)];
                    } else if (healers.length > 0 && Math.random() < 0.6) {
                        target = healers[Math.floor(Math.random() * healers.length)];
                    } else if (nonWasps.length > 0) {
                        target = nonWasps[Math.floor(Math.random() * nonWasps.length)];
                    }
                }
                break;

            case 'investigate_suspicious':
            case 'investigate_exact':
                // Investigators prioritize suspicious behavior
                if (botTeam === 'bee') {
                    // Avoid investigating confirmed bees, prefer unknowns
                    const unknowns = validTargets.filter(p => {
                        // In debug mode, bot has some meta knowledge
                        if (game.debugMode) {
                            return ROLES[p.role].team !== 'bee' && Math.random() < 0.8;
                        }
                        // Normal mode - random but avoid repeat investigations if possible
                        return !game.botMemory?.[bot.id]?.investigated?.includes(p.id);
                    });
                    target = unknowns.length > 0 ?
                        unknowns[Math.floor(Math.random() * unknowns.length)] :
                        validTargets[Math.floor(Math.random() * validTargets.length)];

                    // Remember who was investigated
                    if (!game.botMemory) game.botMemory = {};
                    if (!game.botMemory[bot.id]) game.botMemory[bot.id] = { investigated: [] };
                    if (target) game.botMemory[bot.id].investigated.push(target.id);
                }
                break;

            case 'consigliere':
                // Spy Wasp investigates for team
                const nonWasps = validTargets.filter(p => ROLES[p.role].team !== 'wasp');
                target = nonWasps.length > 0 ?
                    nonWasps[Math.floor(Math.random() * nonWasps.length)] :
                    validTargets[Math.floor(Math.random() * validTargets.length)];
                break;

            case 'heal':
            case 'guard':
                // Protectors prioritize important roles and threatened players
                if (botTeam === 'bee') {
                    const bees = validTargets.filter(p => ROLES[p.role].team === 'bee');
                    const importantBees = bees.filter(p => {
                        const type = ROLES[p.role].actionType;
                        return type === 'investigate_suspicious' || type === 'investigate_exact' || type === 'heal';
                    });

                    // Higher chance to protect important roles
                    if (importantBees.length > 0 && Math.random() < 0.7) {
                        target = importantBees[Math.floor(Math.random() * importantBees.length)];
                    } else if (bees.length > 0) {
                        target = bees[Math.floor(Math.random() * bees.length)];
                    } else {
                        target = validTargets[Math.floor(Math.random() * validTargets.length)];
                    }
                }
                break;

            case 'lookout':
            case 'track':
                // Info roles target randomly
                target = validTargets[Math.floor(Math.random() * validTargets.length)];
                break;

            case 'shoot':
                // Soldier shoots suspected wasps
                if (botTeam === 'bee' && bot.bullets > 0) {
                    const suspects = validTargets.filter(p => ROLES[p.role].team === 'wasp');
                    if (game.debugMode && suspects.length > 0 && Math.random() < 0.7) {
                        target = suspects[Math.floor(Math.random() * suspects.length)];
                    } else {
                        target = validTargets[Math.floor(Math.random() * validTargets.length)];
                    }
                }
                break;

            case 'serial_kill':
                // Murder Hornet kills anyone
                target = validTargets[Math.floor(Math.random() * validTargets.length)];
                break;

            case 'vest':
                // Survivor uses vest when threat is high
                if (botTeam === 'neutral') {
                    const threatLevel = waspCount / beeCount;
                    const shouldVest = (threatLevel > 0.5 && Math.random() < 0.8) ||
                                      (game.nightNumber === 1 && Math.random() < 0.6);
                    if (shouldVest && (!bot.vestsUsed || bot.vestsUsed < 3)) {
                        target = bot; // Target self for vest
                        bot.vestsUsed = (bot.vestsUsed || 0) + 1;
                    }
                }
                break;

            case 'roleblock':
                // Consort roleblocks investigators or healers
                const investigators = validTargets.filter(p => {
                    const type = ROLES[p.role].actionType;
                    return type === 'investigate_suspicious' || type === 'investigate_exact';
                });
                const healers = validTargets.filter(p => ROLES[p.role].actionType === 'heal');

                if (investigators.length > 0 && Math.random() < 0.6) {
                    target = investigators[Math.floor(Math.random() * investigators.length)];
                } else if (healers.length > 0 && Math.random() < 0.5) {
                    target = healers[Math.floor(Math.random() * healers.length)];
                } else {
                    target = validTargets[Math.floor(Math.random() * validTargets.length)];
                }
                break;

            case 'werewolf':
                // Werebee only acts on full moon nights
                if (game.isFullMoon) {
                    // Target anyone randomly
                    target = validTargets[Math.floor(Math.random() * validTargets.length)];
                }
                break;

            case 'zombee_vote':
                // Zombees vote on who to infect (target non-zombees)
                const nonZombees = validTargets.filter(p => ROLES[p.role]?.team !== 'zombee');
                if (nonZombees.length > 0) {
                    target = nonZombees[Math.floor(Math.random() * nonZombees.length)];
                    // Store as zombee vote instead of night action
                    game.zombeeVotes[bot.id] = target.id;
                    console.log(`🧟 Bot ${bot.username} (Zombee) voted to infect ${target.username}`);
                }
                break;

            default:
                // Default random targeting
                target = validTargets[Math.floor(Math.random() * validTargets.length)];
        }

        // Don't store zombee votes in nightActions (they're stored separately)
        if (target && roleInfo.actionType !== 'zombee_vote') {
            game.nightActions[bot.id] = {
                action: roleInfo.actionType,
                target: target.id
            };

            console.log(`🤖 Bot ${bot.username} (${roleInfo.name}) targeting ${target.username || 'self'}`);
        }
    });
}

function performBotVotes(game) {
    const alivePlayers = game.players.filter(p => p.alive);
    const bots = alivePlayers.filter(p => p.isBot);

    // Calculate current votes to make coordinated decisions
    const currentVotes = {};
    Object.values(game.votes).forEach(vote => {
        if (vote && vote !== 'skip') {
            currentVotes[vote] = (currentVotes[vote] || 0) + 1;
        }
    });

    bots.forEach(bot => {
        const roleInfo = ROLES[bot.role];
        const botTeam = roleInfo.team;
        const validTargets = alivePlayers.filter(p => p.id !== bot.id);

        if (validTargets.length === 0) {
            game.votes[bot.id] = 'skip';
            return;
        }

        let voteTarget = null;

        // Smart voting based on role and team
        if (botTeam === 'bee') {
            // Bees try to vote out suspicious players
            const wasps = validTargets.filter(p => ROLES[p.role].team === 'wasp');
            const neutrals = validTargets.filter(p => ROLES[p.role].team === 'neutral');

            // In debug mode, bees have better intuition
            if (game.debugMode && wasps.length > 0 && Math.random() < 0.8) {
                voteTarget = wasps[Math.floor(Math.random() * wasps.length)];
            } else {
                // Vote for most voted person (bandwagon) or random suspicious
                const mostVoted = Object.entries(currentVotes)
                    .sort((a, b) => b[1] - a[1])[0];

                if (mostVoted && mostVoted[1] >= 2 && Math.random() < 0.6) {
                    voteTarget = alivePlayers.find(p => p.id === mostVoted[0]);
                } else if (Math.random() < 0.7) {
                    // Random vote with slight preference for quieter players
                    voteTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
                }
            }
        } else if (botTeam === 'wasp') {
            // Wasps coordinate to vote out bees
            const bees = validTargets.filter(p => ROLES[p.role].team === 'bee');
            const importantBees = bees.filter(p =>
                ROLES[p.role].actionType === 'investigate' ||
                ROLES[p.role].actionType === 'heal'
            );

            // Target important roles first
            if (importantBees.length > 0 && Math.random() < 0.8) {
                voteTarget = importantBees[Math.floor(Math.random() * importantBees.length)];
            } else if (bees.length > 0) {
                // Coordinate with other wasps if possible
                const waspVotes = Object.entries(game.votes)
                    .filter(([voterId, target]) => {
                        const voter = alivePlayers.find(p => p.id === voterId);
                        return voter && ROLES[voter.role].team === 'wasp' && target !== 'skip';
                    });

                if (waspVotes.length > 0 && Math.random() < 0.7) {
                    // Join existing wasp vote
                    voteTarget = alivePlayers.find(p => p.id === waspVotes[0][1]);
                } else {
                    voteTarget = bees[Math.floor(Math.random() * bees.length)];
                }
            }
        } else if (botTeam === 'neutral') {
            // Neutrals have different strategies
            if (bot.role === 'JESTER_BEE') {
                // Jester wants to be lynched - act suspicious
                if (Math.random() < 0.3) {
                    // Sometimes vote randomly to seem suspicious
                    voteTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
                } else {
                    // Often skip to seem unhelpful
                    voteTarget = null;
                }
            } else if (bot.role === 'SURVIVOR_BEE') {
                // Survivor votes with majority
                const mostVoted = Object.entries(currentVotes)
                    .sort((a, b) => b[1] - a[1])[0];

                if (mostVoted && mostVoted[1] >= 2) {
                    voteTarget = alivePlayers.find(p => p.id === mostVoted[0]);
                } else {
                    // Skip if no clear majority
                    voteTarget = null;
                }
            }
        }

        // Make the vote
        if (voteTarget) {
            game.votes[bot.id] = voteTarget.id;
            console.log(`🤖 Bot ${bot.username} (${roleInfo.name}) voted for ${voteTarget.username}`);
        } else if (Math.random() < 0.2 || !voteTarget) {
            // Sometimes skip, or skip if no target found
            game.votes[bot.id] = 'skip';
            console.log(`🤖 Bot ${bot.username} (${roleInfo.name}) voted to skip`);
        } else {
            // Fallback random vote
            const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
            game.votes[bot.id] = randomTarget.id;
            console.log(`🤖 Bot ${bot.username} (${roleInfo.name}) voted for ${randomTarget.username}`);
        }
    });
}

// Bot Chat Messages for Realism
function generateBotMessage(bot, game, phase) {
    const roleInfo = ROLES[bot.role];
    const messages = {
        bee: {
            day: [
                "Anyone suspicious last night?",
                "We need to find the wasps!",
                "I think we should focus our votes",
                "Who hasn't been talking?",
                "Let's work together, bees!",
                "That death is suspicious..."
            ],
            voting: [
                "I have my suspicions...",
                "This vote is important",
                "Think carefully about this",
                "We can't afford mistakes"
            ]
        },
        wasp: {
            day: [
                "I didn't see anything suspicious",
                "We should be careful with accusations",
                "Maybe we should skip?",
                "I'm not sure who to trust",
                "This is confusing..."
            ],
            voting: [
                "Hard to decide...",
                "Going with my gut",
                "Hope this is right",
                "Following the evidence"
            ]
        },
        neutral: {
            day: [
                "Interesting night...",
                "Just trying to survive here",
                "Both sides make good points",
                "What do you all think?"
            ],
            voting: [
                "Difficult choice",
                "Going with the flow",
                "Hope I'm right"
            ]
        }
    };

    const teamMessages = messages[roleInfo.team] || messages.neutral;
    const phaseMessages = teamMessages[phase] || teamMessages.day;

    return phaseMessages[Math.floor(Math.random() * phaseMessages.length)];
}

// Custom Role Configuration Helpers
// Helper to pick a random role from array, avoiding duplicates (except Worker Bee and Killer Wasp)
function pickRandomRole(roleArray, usedRoles) {
    const allowedDuplicates = ['WORKER_BEE', 'KILLER_WASP'];

    // Filter out already used roles unless they're allowed duplicates
    const availableRoles = roleArray.filter(role =>
        !usedRoles.includes(role) || allowedDuplicates.includes(role)
    );

    // If no available roles, fall back to Worker Bee
    if (availableRoles.length === 0) {
        return 'WORKER_BEE';
    }

    return availableRoles[Math.floor(Math.random() * availableRoles.length)];
}

function getDefaultRoleConfig(playerCount) {
    // Role categories for smart distribution
    const beeInvestigative = ['QUEENS_GUARD', 'SCOUT_BEE', 'LOOKOUT_BEE', 'TRACKER_BEE', 'SPY_BEE', 'LIBRARIAN_BEE', 'PSYCHIC_BEE', 'POLLINATOR_BEE'];
    const beeNeutral = ['WORKER_BEE', 'ESCORT_BEE', 'TRAPPER_BEE', 'TRANSPORTER_BEE', 'MEDIUM_BEE', 'BEEKEEPER', 'RETRIBUTIONIST_BEE'];
    const beeKilling = ['SOLDIER_BEE', 'GUARD_BEE', 'VETERAN_BEE'];

    const waspKilling = ['KILLER_WASP', 'POISONER_WASP'];
    const waspInvestigative = ['SPY_WASP', 'MOLE_WASP'];
    const waspNeutral = ['CONSORT_WASP', 'JANITOR_WASP', 'BLACKMAILER_WASP', 'HYPNOTIST_WASP', 'DECEIVER_WASP', 'SABOTEUR_WASP'];

    const neutrals = ['BUTTERFLY', 'CLOWN_BEETLE', 'BOUNTY_HUNTER'];

    const roles = [];

    // ALWAYS NEEDED: Nurse Bee and Queens Guard
    if (playerCount >= 1) roles.push('NURSE_BEE');
    if (playerCount >= 2) roles.push('QUEENS_GUARD');

    // WASPS: Always start with Queen
    if (playerCount >= 3) roles.push('WASP_QUEEN');

    // Add more bees for 4-5 players
    if (playerCount >= 4) {
        roles.push(pickRandomRole(beeInvestigative, roles));
    }
    if (playerCount >= 5) {
        roles.push(pickRandomRole(beeNeutral, roles));
    }

    // Second wasp ALWAYS a killer
    if (playerCount >= 6) {
        roles.push(pickRandomRole(waspKilling, roles));
    }

    // Add more bees 7-8
    if (playerCount >= 7) {
        roles.push(pickRandomRole(beeInvestigative, roles));
    }
    if (playerCount >= 8) {
        roles.push(pickRandomRole(beeKilling, roles));
    }

    // Add first neutral at 9+ players
    if (playerCount >= 9) {
        roles.push(pickRandomRole(neutrals, roles));
    }

    // Third wasp should be investigative
    if (playerCount >= 10) {
        roles.push(pickRandomRole(waspInvestigative, roles));
    }

    // Continue filling with balanced distribution
    while (roles.length < playerCount) {
        const current = roles.length;
        const waspCount = roles.filter(r => ROLES[r]?.team === 'wasp').length;
        const beeCount = roles.filter(r => ROLES[r]?.team === 'bee').length;
        const neutralCount = roles.filter(r => ROLES[r]?.team === 'neutral').length;

        const waspRatio = waspCount / current;

        // Maintain 25-30% wasps
        if (waspRatio < 0.25) {
            // Add random wasp
            const allWasps = [...waspKilling, ...waspInvestigative, ...waspNeutral];
            roles.push(pickRandomRole(allWasps, roles));
        } else if (current >= 9 && neutralCount < 2 && Math.random() < 0.15) {
            // 15% chance for neutral in larger games
            roles.push(pickRandomRole(neutrals, roles));
        } else {
            // Add bee - balanced distribution
            const rand = Math.random();
            if (rand < 0.45) {
                // 45% investigative
                roles.push(pickRandomRole(beeInvestigative, roles));
            } else if (rand < 0.75) {
                // 30% neutral/niche
                roles.push(pickRandomRole(beeNeutral, roles));
            } else {
                // 25% killing
                roles.push(pickRandomRole(beeKilling, roles));
            }
        }
    }

    return roles;
}

function autoAddRoles(gameRoom, count) {
    // Role categories for smart distribution
    const beeInvestigative = ['QUEENS_GUARD', 'SCOUT_BEE', 'LOOKOUT_BEE', 'TRACKER_BEE', 'SPY_BEE', 'LIBRARIAN_BEE', 'PSYCHIC_BEE', 'POLLINATOR_BEE'];
    const beeNeutral = ['WORKER_BEE', 'ESCORT_BEE', 'TRAPPER_BEE', 'TRANSPORTER_BEE', 'MEDIUM_BEE', 'BEEKEEPER', 'RETRIBUTIONIST_BEE'];
    const beeKilling = ['SOLDIER_BEE', 'GUARD_BEE', 'VETERAN_BEE'];

    const waspKilling = ['KILLER_WASP', 'POISONER_WASP'];
    const waspInvestigative = ['SPY_WASP', 'MOLE_WASP'];
    const waspNeutral = ['CONSORT_WASP', 'JANITOR_WASP', 'BLACKMAILER_WASP', 'HYPNOTIST_WASP', 'DECEIVER_WASP', 'SABOTEUR_WASP'];

    const neutrals = ['BUTTERFLY', 'CLOWN_BEETLE', 'BOUNTY_HUNTER'];

    const currentCount = gameRoom.customRoles.length;
    const teamCounts = { bee: 0, wasp: 0, neutral: 0 };

    // Count current team distribution and check for required roles
    let hasNurse = false;
    let hasQueensGuard = false;
    let hasWaspQueen = false;
    let waspKillerCount = 0;
    let waspInvestigativeCount = 0;

    gameRoom.customRoles.forEach(roleKey => {
        const role = ROLES[roleKey];
        if (role) {
            teamCounts[role.team]++;
            if (roleKey === 'NURSE_BEE') hasNurse = true;
            if (roleKey === 'QUEENS_GUARD') hasQueensGuard = true;
            if (roleKey === 'WASP_QUEEN') hasWaspQueen = true;
            if (role.team === 'wasp' && waspKilling.includes(roleKey)) waspKillerCount++;
            if (role.team === 'wasp' && waspInvestigative.includes(roleKey)) waspInvestigativeCount++;
        }
    });

    const roles = [];
    // Track all used roles (existing + new)
    const allUsedRoles = [...gameRoom.customRoles];

    for (let i = 0; i < count; i++) {
        const totalRoles = currentCount + roles.length;
        const newWaspCount = teamCounts.wasp + roles.filter(r => ROLES[r]?.team === 'wasp').length;
        const waspRatio = newWaspCount / (totalRoles || 1);

        // Priority 1: Always ensure Nurse Bee
        if (!hasNurse && roles.filter(r => r === 'NURSE_BEE').length === 0) {
            roles.push('NURSE_BEE');
            allUsedRoles.push('NURSE_BEE');
            hasNurse = true;
            continue;
        }

        // Priority 2: Always ensure Queens Guard
        if (!hasQueensGuard && roles.filter(r => r === 'QUEENS_GUARD').length === 0) {
            roles.push('QUEENS_GUARD');
            allUsedRoles.push('QUEENS_GUARD');
            hasQueensGuard = true;
            continue;
        }

        // Priority 3: Ensure Wasp Queen if we have wasps or need them
        if (!hasWaspQueen && (teamCounts.wasp > 0 || waspRatio < 0.25)) {
            roles.push('WASP_QUEEN');
            allUsedRoles.push('WASP_QUEEN');
            hasWaspQueen = true;
            teamCounts.wasp++;
            continue;
        }

        // Priority 4: Second wasp ALWAYS a killer
        if (newWaspCount === 1 && waspKillerCount === 0) {
            const killer = pickRandomRole(waspKilling, allUsedRoles);
            roles.push(killer);
            allUsedRoles.push(killer);
            teamCounts.wasp++;
            waspKillerCount++;
            continue;
        }

        // Priority 5: Third wasp should be investigative
        if (newWaspCount === 2 && waspInvestigativeCount === 0 && waspRatio < 0.3) {
            const investigator = pickRandomRole(waspInvestigative, allUsedRoles);
            roles.push(investigator);
            allUsedRoles.push(investigator);
            teamCounts.wasp++;
            waspInvestigativeCount++;
            continue;
        }

        // Normal distribution - maintain 25-30% wasps
        if (waspRatio < 0.25 && newWaspCount > 0) {
            // Add random wasp (after priorities are met, truly random)
            const allWasps = [...waspKilling, ...waspInvestigative, ...waspNeutral];
            const wasp = pickRandomRole(allWasps, allUsedRoles);
            roles.push(wasp);
            allUsedRoles.push(wasp);
            teamCounts.wasp++;
        } else if (totalRoles >= 9 && teamCounts.neutral < 2 && Math.random() < 0.15) {
            // 15% chance for neutral in larger games (9+ players)
            const neutral = pickRandomRole(neutrals, allUsedRoles);
            roles.push(neutral);
            allUsedRoles.push(neutral);
            teamCounts.neutral++;
        } else {
            // Add bee with smart distribution
            const rand = Math.random();
            let bee;
            if (rand < 0.45) {
                // 45% investigative
                bee = pickRandomRole(beeInvestigative, allUsedRoles);
            } else if (rand < 0.75) {
                // 30% neutral/niche
                bee = pickRandomRole(beeNeutral, allUsedRoles);
            } else {
                // 25% killing
                bee = pickRandomRole(beeKilling, allUsedRoles);
            }
            roles.push(bee);
            allUsedRoles.push(bee);
            teamCounts.bee++;
        }
    }

    return roles;
}

function broadcastRoleConfig(io, gameId, gameRoom) {
    io.to(gameId).emit('role_config_updated', {
        roles: gameRoom.customRoles,
        availableRoles: { ROLES }, // Send all available roles
        randomRolePools: RANDOM_ROLE_POOLS // Send random role options
    });
}

function createGame(socket, io, data) {
    const { name, maxPlayers = 20, gameMode = 'basic', debugMode = false, isPrivate = false } = data;

    if (activeGameRooms.size >= 5) {
        return socket.emit('error', { message: 'Maximum number of concurrent games reached' });
    }

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate room code for private rooms
    const roomCode = isPrivate ? generateRoomCode() : null;

    const gameRoom = {
        gameId,
        name: name || `${socket.username}'s Game`,
        host: socket.username,
        hostId: socket.userId,
        players: [{
            id: socket.userId,
            username: socket.username,
            socketId: socket.id,
            ready: false
        }],
        maxPlayers,
        gameMode,
        debugMode: debugMode || false,
        isPrivate: isPrivate || false,
        roomCode,
        status: 'waiting', // waiting, starting, playing, finished
        createdAt: Date.now(),
        customRoles: gameMode === 'custom' ? getDefaultRoleConfig(1) : [] // Initialize with default role for first player
    };

    activeGameRooms.set(gameId, gameRoom);

    // Mark player as in game
    const player = activePlayers.get(socket.userId);
    if (player) {
        player.inGame = true;
        player.gameId = gameId;
    }

    socket.join(gameId);
    socket.emit('game_created', {
        gameId,
        game: gameRoom,
        roomCode: gameRoom.roomCode
    });

    updateLobby(io);

    console.log(`Game created: ${gameId} by ${socket.username}${isPrivate ? ` (Private: ${roomCode})` : ''}${debugMode ? ' [DEBUG]' : ''}`);
}

function joinGame(socket, io, data) {
    const { gameId, roomCode } = data;

    // If a room code is provided, find the game by room code
    let gameRoom;
    if (roomCode) {
        gameRoom = Array.from(activeGameRooms.values()).find(g => g.roomCode === roomCode);
        if (!gameRoom) {
            return socket.emit('join_game_error', { error: 'Invalid room code' });
        }
    } else {
        gameRoom = activeGameRooms.get(gameId);
    }

    if (!gameRoom) {
        return socket.emit('join_game_error', { error: 'Game not found' });
    }

    // Check if room is private and requires code
    if (gameRoom.isPrivate && !roomCode) {
        return socket.emit('join_game_error', { error: 'This is a private room. Room code required.' });
    }

    // Validate room code for private rooms
    if (gameRoom.isPrivate && roomCode && gameRoom.roomCode !== roomCode) {
        return socket.emit('join_game_error', { error: 'Invalid room code' });
    }

    if (gameRoom.status !== 'waiting') {
        return socket.emit('join_game_error', { error: 'Game already started' });
    }

    if (gameRoom.players.length >= gameRoom.maxPlayers) {
        return socket.emit('join_game_error', { error: 'Game is full' });
    }

    // If already in game, just send the current state (e.g., creator rejoining)
    if (gameRoom.players.some(p => p.id === socket.userId)) {
        socket.join(gameRoom.gameId); // Ensure they're in the socket room
        return socket.emit('joined_game', { gameId: gameRoom.gameId, game: gameRoom });
    }

    gameRoom.players.push({
        id: socket.userId,
        username: socket.username,
        socketId: socket.id,
        ready: false
    });

    const player = activePlayers.get(socket.userId);
    if (player) {
        player.inGame = true;
        player.gameId = gameRoom.gameId;
    }

    // Auto-add role for custom mode when player joins
    if (gameRoom.gameMode === 'custom' && gameRoom.customRoles) {
        const currentPlayerCount = gameRoom.players.length;
        const currentRoleCount = gameRoom.customRoles.length;

        if (currentRoleCount < currentPlayerCount) {
            const rolesToAdd = autoAddRoles(gameRoom, currentPlayerCount - currentRoleCount);
            gameRoom.customRoles.push(...rolesToAdd);
            // Broadcast updated role config
            broadcastRoleConfig(io, gameRoom.gameId, gameRoom);
        }
    }

    socket.join(gameRoom.gameId);

    io.to(gameRoom.gameId).emit('player_joined_game', {
        player: { username: socket.username, userId: socket.userId },
        players: gameRoom.players.map(p => ({
            username: p.username,
            userId: p.id,
            isHost: p.id === gameRoom.hostId
        }))
    });

    socket.emit('joined_game', { gameId: gameRoom.gameId, game: gameRoom });

    updateLobby(io);

    console.log(`${socket.username} joined game: ${gameRoom.gameId}${gameRoom.isPrivate ? ' (Private)' : ''}`);
}

function leaveGame(socket, io, data) {
    const { gameId } = data;

    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return;
    }

    gameRoom.players = gameRoom.players.filter(p => p.id !== socket.userId);

    const player = activePlayers.get(socket.userId);
    if (player) {
        player.inGame = false;
        delete player.gameId;
    }

    socket.leave(gameId);

    if (gameRoom.players.length === 0) {
        activeGameRooms.delete(gameId);
        const game = getGame(gameId);
        if (game) {
            deleteGame(gameId);
        }
        console.log(`Game deleted (empty): ${gameId}`);
    } else if (gameRoom.hostId === socket.userId) {
        // Host left, reassign to next player if available
        if (gameRoom.players.length > 0) {
            gameRoom.hostId = gameRoom.players[0].id;
            gameRoom.host = gameRoom.players[0].username;
            io.to(gameId).emit('host_changed', {
                host: gameRoom.host,
                hostId: gameRoom.hostId
            });
            console.log(`Host reassigned to ${gameRoom.host} in game ${gameId}`);
        }
    }

    io.to(gameId).emit('player_left_game', {
        player: { username: socket.username, userId: socket.userId },
        players: gameRoom.players.map(p => ({
            username: p.username,
            userId: p.id,
            isHost: p.id === gameRoom.hostId
        }))
    });

    updateLobby(io);

    console.log(`${socket.username} left game: ${gameId}`);
}

function toggleReady(socket, io, data) {
    const { gameId } = data;

    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    const player = gameRoom.players.find(p => p.id === socket.userId);

    if (!player) {
        return socket.emit('error', { message: 'You are not in this game' });
    }

    // Toggle ready status
    player.ready = !player.ready;

    // Broadcast updated player list to all players in the room
    io.to(gameId).emit('players_updated', {
        players: gameRoom.players.map(p => ({
            username: p.username,
            userId: p.id,
            ready: p.ready || false,
            isHost: p.id === gameRoom.hostId
        }))
    });

    // Check if all players are ready for auto-start
    const allReady = gameRoom.players.length >= 2 && gameRoom.players.every(p => p.ready);
    if (allReady) {
        io.to(gameId).emit('all_players_ready');
    }

    console.log(`${socket.username} is now ${player.ready ? 'ready' : 'not ready'} in game ${gameId}`);
}

function startGame(socket, io, data) {
    const { gameId, preset, customDurations } = data;

    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    if (gameRoom.hostId !== socket.userId) {
        return socket.emit('error', { message: 'Only the host can start the game' });
    }

    const constants = getGameConstants(gameRoom.debugMode);

    if (gameRoom.players.length < constants.MIN_PLAYERS) {
        return socket.emit('error', { message: `Need at least ${constants.MIN_PLAYERS} players to start` });
    }

    if (gameRoom.status !== 'waiting') {
        return socket.emit('error', { message: 'Game already started' });
    }

    gameRoom.status = 'starting';

    // Get role distribution
    let roleDistribution;
    if (gameRoom.gameMode === 'custom' && gameRoom.customRoles) {
        // Use custom role configuration
        roleDistribution = gameRoom.customRoles;

        // Validate: Must have enough roles for all players
        if (roleDistribution.length !== gameRoom.players.length) {
            gameRoom.status = 'waiting';
            return socket.emit('error', {
                message: `Role count mismatch! Need exactly ${gameRoom.players.length} roles, have ${roleDistribution.length}`
            });
        }

        // Validate: Must have at least one Wasp (including random wasp pools)
        const hasWasp = roleDistribution.some(roleKey => {
            // Check regular roles
            if (ROLES[roleKey]?.team === 'wasp') return true;
            // Check random role pools
            if (RANDOM_ROLE_POOLS[roleKey]?.team === 'wasp') return true;
            return false;
        });
        if (!hasWasp) {
            gameRoom.status = 'waiting';
            return socket.emit('error', {
                message: 'Invalid role configuration: Must have at least one Wasp role!'
            });
        }
    } else if (preset) {
        roleDistribution = getPresetDistribution(preset, gameRoom.players.length);
    } else {
        roleDistribution = getRoleDistribution(gameRoom.players.length, false, gameRoom.debugMode);
    }

    if (!roleDistribution) {
        gameRoom.status = 'waiting';
        return socket.emit('error', { message: 'Invalid player count or preset' });
    }

    // Resolve random roles to actual roles
    roleDistribution = roleDistribution.map(roleKey => {
        // Check if this is a random role pool
        if (RANDOM_ROLE_POOLS[roleKey]) {
            const resolvedRole = resolveRandomRole(roleKey);
            if (resolvedRole) {
                console.log(`🎲 Resolved ${roleKey} -> ${resolvedRole}`);
                return resolvedRole;
            } else {
                console.warn(`⚠️ Failed to resolve random role: ${roleKey}, keeping original`);
                return roleKey;
            }
        }
        return roleKey;
    });

    // Shuffle and assign roles
    const shuffledRoles = shuffleArray(roleDistribution);
    const gamePlayers = gameRoom.players.map((p, index) => {
        const player = {
            id: p.id,
            username: p.username,
            socketId: p.socketId,
            alive: true,
            role: null,
            isBot: p.isBot || false
        };
        initializePlayerRole(player, shuffledRoles[index]);
        return player;
    });

    // Create game state
    const game = createGameState(
        gameId,
        gamePlayers,
        gameRoom.hostId,
        {
            gameMode: gameRoom.gameMode,
            debugMode: gameRoom.debugMode,
            instantTransitions: gameRoom.debugMode, // Enable instant transitions in debug mode
            customDurations: customDurations, // Pass custom phase durations if provided
            startedAt: Date.now()
        }
    );

    gameRoom.status = 'playing';

    // Send role assignments privately (skip bots)
    gamePlayers.forEach(player => {
        if (!player.isBot) {
            const socket = io.sockets.sockets.get(player.socketId);
            if (socket) {
                const roleInfo = ROLES[player.role];
                // Safety check for role existence
                if (roleInfo) {
                    // Get team members for team-based roles
                    let teamMembers = [];
                    if (roleInfo.team === 'wasp' || roleInfo.team === 'zombee' || roleInfo.id === 'MASON_BEE' || roleInfo.id === 'mason') {
                        teamMembers = gamePlayers
                            .filter(p => {
                                const pRole = ROLES[p.role];
                                if (!pRole) return false;
                                // Same team
                                if (roleInfo.team === 'wasp' && pRole.team === 'wasp') return true;
                                if (roleInfo.team === 'zombee' && pRole.team === 'zombee') return true;
                                // Masons
                                if ((roleInfo.id === 'MASON_BEE' || roleInfo.id === 'mason') &&
                                    (pRole.id === 'MASON_BEE' || pRole.id === 'mason')) return true;
                                return false;
                            })
                            .filter(p => p.id !== player.id) // Exclude self
                            .map(p => ({ id: p.id, username: p.username }));
                    }

                    socket.emit('role_assigned', {
                        role: roleInfo.name,
                        roleKey: player.role,
                        emoji: roleInfo.emoji,
                        team: roleInfo.team,
                        description: roleInfo.description,
                        abilities: roleInfo.abilities || [],
                        winCondition: roleInfo.winCondition || 'Win with your team',
                        nightAction: roleInfo.nightAction || false,
                        actionType: roleInfo.actionType,
                        attack: roleInfo.attack,
                        defense: roleInfo.defense,
                        bullets: roleInfo.bullets,
                        vests: roleInfo.vests,
                        alerts: roleInfo.alerts,
                        selfHealsLeft: roleInfo.selfHealsLeft,
                        executions: roleInfo.executions,
                        cleans: roleInfo.cleans,
                        disguises: roleInfo.disguises,
                        mimics: roleInfo.mimics,
                        silences: roleInfo.silences,
                        teamMembers: teamMembers
                    });
                } else {
                    console.error(`⚠️ Cannot send role assignment - role ${player.role} not found`);
                }
            }
        }
    });

    // Start setup phase
    io.to(gameId).emit('game_started', {
        phase: 'setup',
        message: 'Game starting! Check your role...'
    });

    // Transition to night after setup delay
    setTimeout(() => {
        startNightPhase(io, gameId);
    }, getPhaseDuration(game, 'setup'));

    console.log(`Game started: ${gameId} with ${gamePlayers.length} players`);
}

function startNightPhase(io, gameId) {
    const game = getGame(gameId);
    if (!game) return;

    const constants = getGameConstants(game.debugMode);

    game.phase = 'night';
    game.nightNumber++;
    clearNightData(game);

    // Update full moon status (every other night when Werebee is in game)
    if (game.hasWerebee) {
        game.isFullMoon = (game.nightNumber % 2 === 1);
    }

    const alivePlayers = game.players.filter(p => p.alive);

    io.to(gameId).emit('phase_changed', {
        phase: 'night',
        nightNumber: game.nightNumber,
        players: game.players.map(p => ({ id: p.id, username: p.username, alive: p.alive !== false, isBot: p.isBot })),
        alivePlayers: alivePlayers.map(p => ({ id: p.id, username: p.username })),
        duration: getPhaseDuration(game, 'night') / 1000,
        isFullMoon: game.isFullMoon || false
    });

    // Prompt players for night actions
    game.players.forEach(player => {
        if (player.alive && !player.isBot) {
            const roleInfo = ROLES[player.role];

            // Werebee only acts on full moon nights
            if (roleInfo.nightAction) {
                if (player.role === 'WEREBEE' && !game.isFullMoon) {
                    return; // Werebee cannot act on non-full moon nights
                }

                const socket = io.sockets.sockets.get(player.socketId);
                if (socket) {
                    socket.emit('request_night_action', {
                        actionType: roleInfo.actionType,
                        availableTargets: game.players
                            .filter(p => p.alive && p.id !== player.id)
                            .map(p => ({ id: p.id, username: p.username }))
                    });
                }
            }
        }
    });

    // Bots perform actions after a short delay (simulate thinking)
    // In debug mode with instant transitions, bots act immediately
    const botActionDelay = game.debugMode && game.instantTransitions ? 100 : 2000;
    setTimeout(() => {
        performBotNightActions(game);

        // Send bot messages for realism
        if (game.debugMode) {
            const botPlayers = game.players.filter(p => p.isBot && p.alive);
            botPlayers.forEach(bot => {
                if (Math.random() < 0.3) { // 30% chance to send message
                    const message = generateBotMessage(bot, game, 'night');
                    io.to(gameId).emit('chat_message', {
                        userId: bot.id,
                        username: bot.username,
                        message: message,
                        timestamp: Date.now()
                    });
                }
            });
        }
    }, botActionDelay);

    // Auto-advance after night duration
    // In debug mode with instant transitions, phase is much shorter (unless custom durations are set)
    const nightDuration = game.customDurations && game.customDurations.night
        ? getPhaseDuration(game, 'night')
        : (game.debugMode && game.instantTransitions ? 5000 : getPhaseDuration(game, 'night'));
    setTimeout(() => {
        processNight(io, gameId);
    }, nightDuration);
}

function processNight(io, gameId) {
    const game = getGame(gameId);
    if (!game) return;

    // Process all night actions
    const results = processNightActions(game);

    // Send public night results (deaths) to all players
    io.to(gameId).emit('night_results', {
        deaths: results.deaths || []
    });

    // Send investigation results privately to investigators
    if (results.investigations) {
        results.investigations.forEach((investigationResult, investigatorId) => {
            const investigator = game.players.find(p => p.id === investigatorId);
            if (investigator && investigator.socketId) {
                const socket = io.sockets.sockets.get(investigator.socketId);
                if (socket) {
                    socket.emit('investigation_result', {
                        type: investigationResult.type,
                        target: investigationResult.target,
                        result: investigationResult.result
                    });
                }
            }
        });
    }

    // Send night event notifications to affected players
    if (results.playerEvents) {
        results.playerEvents.forEach((events, playerId) => {
            const player = game.players.find(p => p.id === playerId);
            if (player && player.socketId) {
                const socket = io.sockets.sockets.get(player.socketId);
                if (socket) {
                    // Send each event to the player
                    events.forEach(event => {
                        socket.emit('night_event', event);
                    });
                }
            }
        });
    }

    // Handle zombee conversions - send new role info to converted players
    if (results.conversions && results.conversions.length > 0) {
        results.conversions.forEach(conversion => {
            const player = game.players.find(p => p.id === conversion.playerId);
            if (player && player.socketId) {
                const socket = io.sockets.sockets.get(player.socketId);
                if (socket && !player.isBot) {
                    const roleInfo = ROLES[conversion.newRole];
                    socket.emit('role_changed', {
                        role: roleInfo.name,
                        roleKey: conversion.newRole,
                        emoji: roleInfo.emoji,
                        team: roleInfo.team,
                        description: roleInfo.description,
                        abilities: roleInfo.abilities || [],
                        winCondition: roleInfo.winCondition || 'Win with your team',
                        nightAction: roleInfo.nightAction || false,
                        actionType: roleInfo.actionType,
                        attack: roleInfo.attack,
                        defense: roleInfo.defense
                    });
                }
            }
        });
    }

    // Check win conditions
    const winCondition = checkWinConditions(game);
    if (winCondition) {
        endGame(io, gameId, winCondition);
        return;
    }

    // Start day phase
    startDayPhase(io, gameId);
}

function startDayPhase(io, gameId) {
    const game = getGame(gameId);
    if (!game) return;

    const constants = getGameConstants(game.debugMode);

    game.phase = 'day';

    const alivePlayers = game.players.filter(p => p.alive);

    io.to(gameId).emit('phase_changed', {
        phase: 'day',
        players: game.players.map(p => ({ id: p.id, username: p.username, alive: p.alive !== false, isBot: p.isBot })),
        alivePlayers: alivePlayers.map(p => ({ id: p.id, username: p.username })),
        duration: getPhaseDuration(game, 'day') / 1000
    });

    // Auto-advance to voting after day duration
    // In debug mode with instant transitions, discussion is much shorter (unless custom durations are set)
    const discussionDuration = game.customDurations && game.customDurations.day
        ? getPhaseDuration(game, 'day')
        : (game.debugMode && game.instantTransitions ? 10000 : getPhaseDuration(game, 'day'));

    // Send bot messages during day phase
    if (game.debugMode) {
        setTimeout(() => {
            const botPlayers = game.players.filter(p => p.isBot && p.alive);
            botPlayers.forEach(bot => {
                if (Math.random() < 0.4) { // 40% chance to send message
                    const message = generateBotMessage(bot, game, 'day');
                    io.to(gameId).emit('chat_message', {
                        userId: bot.id,
                        username: bot.username,
                        message: message,
                        timestamp: Date.now()
                    });
                }
            });
        }, Math.floor(discussionDuration * 0.3)); // Send messages 30% into discussion
    }

    setTimeout(() => {
        startVotingPhase(io, gameId);
    }, discussionDuration);
}

function startVotingPhase(io, gameId) {
    const game = getGame(gameId);
    if (!game) return;

    const constants = getGameConstants(game.debugMode);

    game.phase = 'voting';
    clearVotes(game);

    const alivePlayers = game.players.filter(p => p.alive);

    io.to(gameId).emit('phase_changed', {
        phase: 'voting',
        players: game.players.map(p => ({ id: p.id, username: p.username, alive: p.alive !== false, isBot: p.isBot })),
        votingTargets: alivePlayers.map(p => ({ id: p.id, username: p.username })),
        duration: getPhaseDuration(game, 'voting') / 1000
    });

    // Bots vote after a short delay (simulate thinking)
    const botVoteDelay = game.debugMode && game.instantTransitions ? 500 : 3000;
    setTimeout(() => {
        performBotVotes(game);

        // Send bot voting messages
        if (game.debugMode) {
            const botPlayers = game.players.filter(p => p.isBot && p.alive);
            botPlayers.forEach(bot => {
                if (Math.random() < 0.3) { // 30% chance to send message
                    const message = generateBotMessage(bot, game, 'voting');
                    io.to(gameId).emit('chat_message', {
                        userId: bot.id,
                        username: bot.username,
                        message: message,
                        timestamp: Date.now()
                    });
                }
            });
        }
    }, botVoteDelay);

    // Auto-process votes after voting duration (unless custom durations are set)
    const votingDuration = game.customDurations && game.customDurations.voting
        ? getPhaseDuration(game, 'voting')
        : (game.debugMode && game.instantTransitions ? 8000 : getPhaseDuration(game, 'voting'));
    setTimeout(() => {
        processVotes(io, gameId);
    }, votingDuration);
}

function processVotes(io, gameId) {
    const game = getGame(gameId);
    if (!game) return;

    const voteCounts = countVotes(game.votes);
    const maxVotes = Math.max(...Object.values(voteCounts), 0);

    if (maxVotes > 0) {
        const lynched = Object.keys(voteCounts).find(id => voteCounts[id] === maxVotes);
        const lynchedPlayer = game.players.find(p => p.id === lynched);

        if (lynchedPlayer) {
            lynchedPlayer.alive = false;
            const roleInfo = ROLES[lynchedPlayer.role];

            io.to(gameId).emit('player_lynched', {
                player: { id: lynchedPlayer.id, username: lynchedPlayer.username },
                role: roleInfo.name,
                team: roleInfo.team
            });
        }
    } else {
        io.to(gameId).emit('no_lynch', { message: 'No one was voted out' });
    }

    // Check win conditions
    const winCondition = checkWinConditions(game);
    if (winCondition) {
        endGame(io, gameId, winCondition);
        return;
    }

    // Start next night
    setTimeout(() => {
        startNightPhase(io, gameId);
    }, 5000);
}

async function endGame(io, gameId, winCondition) {
    const game = getGame(gameId);
    const gameRoom = activeGameRooms.get(gameId);
    if (!game || !gameRoom) return;

    game.phase = 'finished';
    gameRoom.status = 'finished';

    const winners = determineWinners(game, winCondition.type, winCondition.winner);

    // Save game to database
    try {
        const gameRecord = new GameModel({
            gameId,
            organizerId: gameRoom.hostId,
            players: game.players.map(p => ({
                userId: p.id,
                username: p.username,
                role: p.role,
                team: ROLES[p.role].team,
                survived: p.alive,
                won: winners.some(w => w.id === p.id)
            })),
            gameMode: gameRoom.gameMode,
            winner: winCondition.type,
            duration: Math.floor((Date.now() - game.startedAt) / 1000),
            nightsCompleted: game.nightNumber,
            startedAt: new Date(game.startedAt),
            endedAt: new Date()
        });

        await gameRecord.save();

        // Update user stats (only for real users, not bots or temporary users)
        for (const player of game.players) {
            // Skip if not a valid MongoDB ObjectId (bot or temporary user)
            if (!player.id.match(/^[0-9a-fA-F]{24}$/)) continue;

            const user = await User.findById(player.id);
            if (user) {
                user.stats.gamesPlayed++;
                const won = winners.some(w => w.id === player.id);
                if (won) {
                    user.stats.gamesWon++;
                    user.currency += GAME_CONSTANTS.WINNER_REWARD;

                        const team = ROLES[player.role].team;
                    if (team === 'bee') user.stats.beeWins++;
                    else if (team === 'wasp') user.stats.waspWins++;
                    else user.stats.neutralWins++;
                }
                await user.save();
            }
        }
    } catch (error) {
        console.error('Error saving game:', error);
    }

    io.to(gameId).emit('game_ended', {
        winnerType: winCondition.type,
        winners: winners.map(w => ({ id: w.id, username: w.username, role: ROLES[w.role].name })),
        allPlayers: game.players.map(p => ({
            username: p.username,
            role: ROLES[p.role].name,
            team: ROLES[p.role].team,
            survived: p.alive
        }))
    });

    // Game stays in finished state until host returns to lobby
    // No auto-cleanup - wait for host action
    console.log(`Game ${gameId} ended. Waiting for host to return to lobby...`);
}

function submitNightAction(socket, io, data) {
    const player = activePlayers.get(socket.userId);
    if (!player || !player.gameId) {
        return socket.emit('error', { message: 'Not in a game' });
    }

    const game = getGame(player.gameId);
    if (!game || game.phase !== 'night') {
        return socket.emit('error', { message: 'Not in night phase' });
    }

    const gamePlayer = game.players.find(p => p.id === socket.userId);
    if (!gamePlayer || !gamePlayer.alive) {
        return socket.emit('error', { message: 'Cannot submit action' });
    }

    // Handle zombee votes separately (similar to wasp kill voting)
    if (data.action === 'zombee_vote') {
        game.zombeeVotes[socket.userId] = data.target;

        // Notify all zombees of the vote
        const zombees = game.players.filter(p => p.alive && ROLES[p.role]?.team === 'zombee');
        zombees.forEach(zombee => {
            const zombeeSocket = io.sockets.sockets.get(zombee.socketId);
            if (zombeeSocket && !zombee.isBot) {
                zombeeSocket.emit('zombee_vote_update', {
                    votes: game.zombeeVotes,
                    totalZombees: zombees.length
                });
            }
        });

        return socket.emit('action_submitted', { message: 'Vote submitted' });
    }

    game.nightActions[socket.userId] = {
        action: data.action,
        target: data.target,
        target2: data.target2 // For roles like Transporter
    };

    socket.emit('action_submitted', { message: 'Action submitted' });
}

function submitVote(socket, io, data) {
    const player = activePlayers.get(socket.userId);
    if (!player || !player.gameId) {
        return socket.emit('error', { message: 'Not in a game' });
    }

    const game = getGame(player.gameId);
    if (!game || game.phase !== 'voting') {
        return socket.emit('error', { message: 'Not in voting phase' });
    }

    const gamePlayer = game.players.find(p => p.id === socket.userId);
    if (!gamePlayer || !gamePlayer.alive) {
        return socket.emit('error', { message: 'Cannot vote' });
    }

    game.votes[socket.userId] = data.target;

    // Get target name
    let targetName = 'skip';
    if (data.target !== 'skip') {
        const targetPlayer = game.players.find(p => p.id === data.target);
        targetName = targetPlayer ? targetPlayer.username : 'unknown';
    }

    io.to(player.gameId).emit('vote_cast', {
        voter: socket.username,
        target: targetName,
        votesRemaining: game.players.filter(p => p.alive).length - Object.keys(game.votes).length
    });
}

/**
 * Unified Chat Handler
 * Handles all chat messages with channel-based visibility
 *
 * Channels:
 * - "all": Living players can see (day/voting phase)
 * - "wasp": Only wasps can see (anytime, especially night)
 * - "dead": Only dead players can see
 * - "jailor": Jailor and their prisoner can see
 * - "mason": Only masons can see
 */
function handleChatMessage(socket, io, data) {
    const player = activePlayers.get(socket.userId);
    if (!player || !player.gameId) {
        return;
    }

    const game = getGame(player.gameId);
    if (!game) return;

    const gamePlayer = game.players.find(p => p.id === socket.userId);
    if (!gamePlayer) return;

    const { message, channel = 'all' } = data;
    const role = ROLES[gamePlayer.role];

    // Determine if player can send messages
    // Living players can chat during day/voting
    // Special roles can chat during night (wasps, zombees, masons, jailor)
    // Dead players can always chat
    let canSend = false;
    let visibilityTag = null;

    if (!gamePlayer.alive) {
        canSend = true;
        visibilityTag = 'dead';
    } else if (game.phase === 'day' || game.phase === 'voting') {
        canSend = true;
        visibilityTag = null; // Everyone can see
    } else if (game.phase === 'night') {
        // Check if player has night chat privileges
        if (role && role.team === 'wasp') {
            canSend = true;
            visibilityTag = 'wasp';
        } else if (role && role.team === 'zombee') {
            canSend = true;
            visibilityTag = 'zombee';
        } else if (role && (role.id === 'MASON_BEE' || role.id === 'mason')) {
            canSend = true;
            visibilityTag = 'mason';
        } else if (role && role.id === 'jailor') {
            canSend = true;
            visibilityTag = 'jailor';
        }
    }

    // Check if mason can always chat
    if (role && (role.id === 'MASON_BEE' || role.id === 'mason')) {
        canSend = true;
        visibilityTag = 'mason';
    }

    // Check if jailor can always chat
    if (role && role.id === 'jailor') {
        canSend = true;
        visibilityTag = 'jailor';
    }

    if (!canSend) {
        return socket.emit('error', { message: 'You cannot send messages at this time' });
    }

    // Create the chat message
    const chatMessage = {
        username: socket.username,
        userId: socket.userId,
        message: message,
        channel: 'all', // Everything goes to all channel
        timestamp: Date.now(),
        isDead: !gamePlayer.alive, // Tag if message is from a dead player
        visibilityTag: visibilityTag // Tag for special visibility (wasp, zombee, mason, jailor)
    };

    // Send to all players in the game
    // Frontend will filter based on what each player can see
    io.to(player.gameId).emit('chat_message', chatMessage);
}

/**
 * Check if a player can send to a specific channel
 */
function canSendToChannel(gamePlayer, game, channel) {
    const role = ROLES[gamePlayer.role];

    switch (channel) {
        case 'all':
            // Living players can chat during day/voting
            // Dead players can always chat (but only dead players will see their messages)
            if (gamePlayer.alive) {
                return game.phase === 'day' || game.phase === 'voting';
            } else {
                return true; // Dead players can always chat in "all" channel
            }

        case 'wasp':
            // Only wasps can use wasp chat
            return role && role.team === 'wasp';

        case 'zombee':
            // Only zombees can use zombee chat
            return role && role.team === 'zombee';

        case 'dead':
            // Only dead players can use dead chat
            return !gamePlayer.alive;

        case 'jailor':
            // Jailor or jailed prisoner can use jailor chat
            if (role && role.id === 'jailor') return true;
            // Check if this player is jailed
            const jailor = game.players.find(p => ROLES[p.role]?.id === 'jailor');
            if (jailor && jailor.jailedPlayer === gamePlayer.id) return true;
            return false;

        case 'mason':
            // Only masons can use mason chat
            return role && role.id === 'mason';

        default:
            return false;
    }
}

// Keep old handlers for backward compatibility, but redirect to unified handler
function handleWaspChat(socket, io, data) {
    handleChatMessage(socket, io, { message: data.message, channel: 'wasp' });
}

function handleDeadChat(socket, io, data) {
    handleChatMessage(socket, io, { message: data.message, channel: 'dead' });
}

function handleDisconnect(socket, io) {
    const player = activePlayers.get(socket.userId);
    if (player && player.gameId) {
        leaveGame(socket, io, { gameId: player.gameId });
    }
}

function addBots(socket, io, data) {
    const { gameId, count = 11 } = data;
    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    // Only host can add bots
    if (gameRoom.hostId !== socket.userId) {
        return socket.emit('error', { message: 'Only the host can add bots' });
    }

    // Only in debug mode
    if (!gameRoom.debugMode) {
        return socket.emit('error', { message: 'Bots can only be added in debug mode' });
    }

    // Check if game already started
    if (gameRoom.status !== 'waiting') {
        return socket.emit('error', { message: 'Cannot add bots after game has started' });
    }

    // Calculate how many bots we can add (don't exceed maxPlayers)
    const currentPlayers = gameRoom.players.length;
    const availableSlots = gameRoom.maxPlayers - currentPlayers;
    const botsToAdd = Math.min(count, availableSlots);

    if (botsToAdd <= 0) {
        return socket.emit('error', { message: 'No available slots for bots' });
    }

    const existingBotCount = gameRoom.players.filter(p => p.isBot).length;
    const botNames = ['BotAlice', 'BotBob', 'BotCharlie', 'BotDiana', 'BotEve', 'BotFrank', 'BotGrace', 'BotHank', 'BotIvy', 'BotJack', 'BotKate', 'BotLeo'];

    console.log(`🤖 Adding ${botsToAdd} bots to game ${gameId}`);

    for (let i = 0; i < botsToAdd; i++) {
        const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const botName = botNames[(existingBotCount + i) % botNames.length] + `_${existingBotCount + i}`;

        gameRoom.players.push({
            id: botId,
            username: botName,
            socketId: null, // Bots don't have socket connections
            isBot: true
        });
    }

    // Notify all players in the game
    io.to(gameId).emit('player_joined_game', {
        player: { username: 'System', userId: 'system' },
        players: gameRoom.players.map(p => ({ username: p.username, userId: p.id, isBot: p.isBot }))
    });

    updateLobby(io);

    socket.emit('bots_added', { count: botsToAdd, totalPlayers: gameRoom.players.length });
}

// Role Configuration Handlers
function getRoleConfig(socket, io, data) {
    const { gameId } = data;
    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    // Send current role configuration
    socket.emit('role_config_updated', {
        roles: gameRoom.customRoles || [],
        availableRoles: { ROLES },
        randomRolePools: RANDOM_ROLE_POOLS
    });
}

function addRoleToConfig(socket, io, data) {
    const { gameId, roleKey } = data;
    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    if (gameRoom.hostId !== socket.userId) {
        return socket.emit('error', { message: 'Only the host can modify roles' });
    }

    if (gameRoom.status !== 'waiting') {
        return socket.emit('error', { message: 'Cannot modify roles after game has started' });
    }

    // Validate role exists (either regular role or random pool)
    if (!ROLES[roleKey] && !RANDOM_ROLE_POOLS[roleKey]) {
        return socket.emit('error', { message: 'Invalid role' });
    }

    if (!gameRoom.customRoles) {
        gameRoom.customRoles = [];
    }

    gameRoom.customRoles.push(roleKey);
    broadcastRoleConfig(io, gameId, gameRoom);

    console.log(`🎭 ${socket.username} added role ${roleKey} to game ${gameId}`);
}

function removeRoleFromConfig(socket, io, data) {
    const { gameId, index } = data;
    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    if (gameRoom.hostId !== socket.userId) {
        return socket.emit('error', { message: 'Only the host can modify roles' });
    }

    if (gameRoom.status !== 'waiting') {
        return socket.emit('error', { message: 'Cannot modify roles after game has started' });
    }

    if (!gameRoom.customRoles || index < 0 || index >= gameRoom.customRoles.length) {
        return socket.emit('error', { message: 'Invalid role index' });
    }

    const removedRole = gameRoom.customRoles.splice(index, 1)[0];
    broadcastRoleConfig(io, gameId, gameRoom);

    console.log(`🎭 ${socket.username} removed role ${removedRole} from game ${gameId}`);
}

function replaceRoleInConfig(socket, io, data) {
    const { gameId, index, roleKey } = data;
    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    if (gameRoom.hostId !== socket.userId) {
        return socket.emit('error', { message: 'Only the host can modify roles' });
    }

    if (gameRoom.status !== 'waiting') {
        return socket.emit('error', { message: 'Cannot modify roles after game has started' });
    }

    // Validate role exists (either regular role or random pool)
    if (!ROLES[roleKey] && !RANDOM_ROLE_POOLS[roleKey]) {
        return socket.emit('error', { message: 'Invalid role' });
    }

    if (!gameRoom.customRoles || index < 0 || index >= gameRoom.customRoles.length) {
        return socket.emit('error', { message: 'Invalid role index' });
    }

    const oldRole = gameRoom.customRoles[index];
    gameRoom.customRoles[index] = roleKey;
    broadcastRoleConfig(io, gameId, gameRoom);

    console.log(`🎭 ${socket.username} replaced role ${oldRole} with ${roleKey} in game ${gameId}`);
}

function autoAddRolesToConfig(socket, io, data) {
    const { gameId, count } = data;
    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    if (gameRoom.hostId !== socket.userId) {
        return socket.emit('error', { message: 'Only the host can modify roles' });
    }

    if (gameRoom.status !== 'waiting') {
        return socket.emit('error', { message: 'Cannot modify roles after game has started' });
    }

    if (!gameRoom.customRoles) {
        gameRoom.customRoles = [];
    }

    const rolesToAdd = autoAddRoles(gameRoom, count);
    gameRoom.customRoles.push(...rolesToAdd);
    broadcastRoleConfig(io, gameId, gameRoom);

    console.log(`🎭 ${socket.username} auto-added ${count} roles to game ${gameId}`);
}

function returnToLobby(socket, io, data) {
    const { gameId } = data;
    const gameRoom = activeGameRooms.get(gameId);

    if (!gameRoom) {
        return socket.emit('error', { message: 'Game not found' });
    }

    // Only host can return everyone to lobby
    if (gameRoom.hostId !== socket.userId) {
        return socket.emit('error', { message: 'Only the host can return to lobby' });
    }

    // Game must be in finished state
    if (gameRoom.status !== 'finished') {
        return socket.emit('error', { message: 'Game is not finished' });
    }

    console.log(`🔄 Host ${socket.username} returning game ${gameId} to lobby`);

    // Delete the finished game state
    deleteGame(gameId);

    // Reset game room to waiting status, PRESERVING customRoles
    gameRoom.status = 'waiting';
    gameRoom.players.forEach(p => {
        p.ready = false;
    });

    // Emit to all players that they're back in lobby
    io.to(gameId).emit('returned_to_lobby', {
        gameId,
        players: gameRoom.players.map(p => ({
            username: p.username,
            userId: p.id,
            ready: p.ready || false,
            isHost: p.id === gameRoom.hostId,
            isBot: p.isBot || false
        })),
        customRoles: gameRoom.customRoles || []
    });

    // Update global lobby
    updateLobby(io);

    console.log(`✅ Game ${gameId} returned to lobby with ${gameRoom.customRoles?.length || 0} roles preserved`);
}

module.exports = {
    createGame,
    joinGame,
    leaveGame,
    toggleReady,
    startGame,
    addBots,
    submitNightAction,
    submitVote,
    handleChatMessage,
    handleWaspChat,
    handleDeadChat,
    handleDisconnect,
    returnToLobby,
    // Role configuration handlers
    getRoleConfig,
    addRoleToConfig,
    removeRoleFromConfig,
    replaceRoleInConfig,
    autoAddRolesToConfig
};
