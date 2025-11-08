/**
 * Game Manager
 * Handles game creation, lifecycle, and player actions
 */

const { createGame: createGameState, getGame, deleteGame, clearNightData, clearVotes } = require('../../../shared/game/gameState');
const { getRoleDistribution, shuffleArray, initializePlayerRole, checkWinConditions, determineWinners, getTeamCounts, countVotes, getGameConstants } = require('../../../shared/game/gameUtils');
const { ROLES } = require('../../../shared/roles');
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

            default:
                // Default random targeting
                target = validTargets[Math.floor(Math.random() * validTargets.length)];
        }

        if (target) {
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
        createdAt: Date.now()
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

    console.log(`Game created: ${gameId} by ${socket.username}${isPrivate ? ` (Private: ${roomCode})` : ''}`);
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

    socket.join(gameRoom.gameId);

    io.to(gameRoom.gameId).emit('player_joined_game', {
        player: { username: socket.username, userId: socket.userId },
        players: gameRoom.players.map(p => ({ username: p.username, userId: p.id }))
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
        gameRoom.hostId = gameRoom.players[0].id;
        gameRoom.host = gameRoom.players[0].username;
        io.to(gameId).emit('host_changed', { host: gameRoom.host });
    }

    io.to(gameId).emit('player_left_game', {
        player: { username: socket.username, userId: socket.userId },
        players: gameRoom.players.map(p => ({ username: p.username, userId: p.id }))
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
    const { gameId, preset } = data;

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

    // In debug mode, fill remaining slots with bots up to 6 players for better testing
    if (gameRoom.debugMode && gameRoom.players.length < 6) {
        const botsNeeded = 6 - gameRoom.players.length;
        console.log(`🤖 Debug mode: Adding ${botsNeeded} bots to fill game`);

        for (let i = 0; i < botsNeeded; i++) {
            const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const botNames = ['BotAlice', 'BotBob', 'BotCharlie', 'BotDiana', 'BotEve', 'BotFrank', 'BotGrace', 'BotHank'];
            const botName = botNames[i % botNames.length] + `_${i}`;

            gameRoom.players.push({
                id: botId,
                username: botName,
                socketId: null, // Bots don't have socket connections
                isBot: true
            });
        }

        io.to(gameId).emit('player_joined_game', {
            player: { username: 'System', userId: 'system' },
            players: gameRoom.players.map(p => ({ username: p.username, userId: p.id }))
        });
    }

    gameRoom.status = 'starting';

    // Get role distribution
    let roleDistribution;
    if (preset) {
        roleDistribution = getPresetDistribution(preset, gameRoom.players.length);
    } else {
        roleDistribution = getRoleDistribution(gameRoom.players.length, false, gameRoom.debugMode);
    }

    if (!roleDistribution) {
        gameRoom.status = 'waiting';
        return socket.emit('error', { message: 'Invalid player count or preset' });
    }

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
                    socket.emit('role_assigned', {
                        role: roleInfo.name,
                        roleKey: player.role,
                        emoji: roleInfo.emoji,
                        team: roleInfo.team,
                        description: roleInfo.description,
                        abilities: roleInfo.abilities || [],
                        winCondition: roleInfo.winCondition || 'Win with your team'
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
    }, constants.SETUP_DELAY);

    console.log(`Game started: ${gameId} with ${gamePlayers.length} players`);
}

function startNightPhase(io, gameId) {
    const game = getGame(gameId);
    if (!game) return;

    const constants = getGameConstants(game.debugMode);

    game.phase = 'night';
    game.nightNumber++;
    clearNightData(game);

    io.to(gameId).emit('phase_changed', {
        phase: 'night',
        nightNumber: game.nightNumber,
        duration: constants.NIGHT_DURATION / 1000
    });

    // Prompt players for night actions
    game.players.forEach(player => {
        if (player.alive && !player.isBot) {
            const roleInfo = ROLES[player.role];
            if (roleInfo.nightAction) {
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
    // In debug mode with instant transitions, phase is much shorter
    const nightDuration = game.debugMode && game.instantTransitions ? 5000 : constants.NIGHT_DURATION;
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
        alivePlayers: alivePlayers.map(p => ({ id: p.id, username: p.username })),
        duration: constants.DAY_DISCUSSION_DURATION / 1000
    });

    // Auto-advance to voting after day duration
    // In debug mode with instant transitions, discussion is much shorter
    const discussionDuration = game.debugMode && game.instantTransitions ? 10000 : constants.DAY_DISCUSSION_DURATION;

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
        votingTargets: alivePlayers.map(p => ({ id: p.id, username: p.username })),
        duration: constants.VOTING_DURATION / 1000
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

    // Auto-process votes after voting duration
    const votingDuration = game.debugMode && game.instantTransitions ? 8000 : constants.VOTING_DURATION;
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

        // Update user stats
        for (const player of game.players) {
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

    // Clean up after 30 seconds
    setTimeout(() => {
        deleteGame(gameId);
        activeGameRooms.delete(gameId);

        gameRoom.players.forEach(p => {
            const player = activePlayers.get(p.id);
            if (player) {
                player.inGame = false;
                delete player.gameId;
            }
        });

        updateLobby(io);
        console.log(`Game ended and cleaned up: ${gameId}`);
    }, 30000);
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

    io.to(player.gameId).emit('vote_cast', {
        voter: socket.username,
        votesRemaining: game.players.filter(p => p.alive).length - Object.keys(game.votes).length
    });
}

function handleChatMessage(socket, io, data) {
    const player = activePlayers.get(socket.userId);
    if (!player || !player.gameId) {
        return;
    }

    const game = getGame(player.gameId);
    if (!game) return;

    const gamePlayer = game.players.find(p => p.id === socket.userId);
    if (!gamePlayer) return;

    // Only living players can chat during day
    if (game.phase === 'day' && gamePlayer.alive) {
        io.to(player.gameId).emit('chat_message', {
            username: socket.username,
            message: data.message,
            timestamp: Date.now()
        });
    }
}

function handleWaspChat(socket, io, data) {
    const player = activePlayers.get(socket.userId);
    if (!player || !player.gameId) {
        return;
    }

    const game = getGame(player.gameId);
    if (!game) return;

    const gamePlayer = game.players.find(p => p.id === socket.userId);
    if (!gamePlayer || ROLES[gamePlayer.role].team !== 'wasp') {
        return;
    }

    // Send to all wasps
    game.players.forEach(p => {
        if (ROLES[p.role].team === 'wasp') {
            const s = io.sockets.sockets.get(p.socketId);
            if (s) {
                s.emit('wasp_chat', {
                    username: socket.username,
                    message: data.message,
                    timestamp: Date.now()
                });
            }
        }
    });
}

function handleDeadChat(socket, io, data) {
    const player = activePlayers.get(socket.userId);
    if (!player || !player.gameId) {
        return;
    }

    const game = getGame(player.gameId);
    if (!game) return;

    const gamePlayer = game.players.find(p => p.id === socket.userId);
    if (!gamePlayer || gamePlayer.alive) {
        return;
    }

    // Send to all dead players
    game.players.forEach(p => {
        if (!p.alive) {
            const s = io.sockets.sockets.get(p.socketId);
            if (s) {
                s.emit('dead_chat', {
                    username: socket.username,
                    message: data.message,
                    timestamp: Date.now()
                });
            }
        }
    });
}

function handleDisconnect(socket, io) {
    const player = activePlayers.get(socket.userId);
    if (player && player.gameId) {
        leaveGame(socket, io, { gameId: player.gameId });
    }
}

module.exports = {
    createGame,
    joinGame,
    leaveGame,
    toggleReady,
    startGame,
    submitNightAction,
    submitVote,
    handleChatMessage,
    handleWaspChat,
    handleDeadChat,
    handleDisconnect
};
