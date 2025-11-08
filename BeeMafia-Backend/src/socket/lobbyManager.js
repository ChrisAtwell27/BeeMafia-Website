/**
 * Lobby Manager
 * Handles lobby functionality - players waiting to join games
 */

const activePlayers = new Map(); // userId -> socket info
const activeGameRooms = new Map(); // gameId -> game room info

function joinLobby(socket, io) {
    activePlayers.set(socket.userId, {
        socketId: socket.id,
        username: socket.username,
        userId: socket.userId,
        inGame: false
    });

    socket.join('lobby');

    // Send current lobby state
    const lobbyPlayers = Array.from(activePlayers.values())
        .filter(p => !p.inGame)
        .map(p => ({ username: p.username, userId: p.userId }));

    const availableGames = Array.from(activeGameRooms.values())
        .filter(game => game.status === 'waiting')
        .map(game => ({
            gameId: game.gameId,
            name: game.name,
            host: game.host,
            players: game.players.length,
            maxPlayers: game.maxPlayers,
            gameMode: game.gameMode,
            debugMode: game.debugMode || false,
            isPrivate: game.isPrivate || false,
            roomCode: game.roomCode || null
        }));

    socket.emit('lobby_state', {
        players: lobbyPlayers,
        games: availableGames,
        onlineCount: activePlayers.size
    });

    // Notify lobby of new player
    io.to('lobby').emit('player_joined_lobby', {
        username: socket.username,
        userId: socket.userId
    });

    console.log(`${socket.username} joined lobby`);
}

function leaveLobby(socket, io) {
    const player = activePlayers.get(socket.userId);
    if (player && !player.inGame) {
        socket.leave('lobby');
        activePlayers.delete(socket.userId);

        io.to('lobby').emit('player_left_lobby', {
            username: socket.username,
            userId: socket.userId
        });

        console.log(`${socket.username} left lobby`);
    }
}

function updateLobby(io) {
    const availableGames = Array.from(activeGameRooms.values())
        .filter(game => game.status === 'waiting')
        .map(game => ({
            gameId: game.gameId,
            name: game.name,
            host: game.host,
            players: game.players.length,
            maxPlayers: game.maxPlayers,
            gameMode: game.gameMode,
            debugMode: game.debugMode || false,
            isPrivate: game.isPrivate || false,
            roomCode: game.roomCode || null
        }));

    console.log(`📢 Broadcasting lobby update: ${availableGames.length} games available`);

    io.to('lobby').emit('lobby_games_update', {
        games: availableGames,
        onlineCount: activePlayers.size
    });
}

module.exports = {
    joinLobby,
    leaveLobby,
    updateLobby,
    activePlayers,
    activeGameRooms
};
