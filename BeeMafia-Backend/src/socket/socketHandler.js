/**
 * Socket.io Event Handlers
 * Main WebSocket connection and event routing
 */

const { authenticateSocket } = require('../middleware/auth');
const gameManager = require('./gameManager');
const lobbyManager = require('./lobbyManager');

function initializeSocketHandlers(io) {
    // Authentication middleware
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.username} (${socket.userId})`);

        // Join lobby
        socket.on('join_lobby', () => {
            lobbyManager.joinLobby(socket, io);
        });

        // Leave lobby
        socket.on('leave_lobby', () => {
            lobbyManager.leaveLobby(socket, io);
        });

        // Create game
        socket.on('create_game', (data) => {
            gameManager.createGame(socket, io, data);
        });

        // Join game
        socket.on('join_game', (data) => {
            gameManager.joinGame(socket, io, data);
        });

        // Leave game
        socket.on('leave_game', (data) => {
            gameManager.leaveGame(socket, io, data);
        });

        // Toggle ready status
        socket.on('toggle_ready', (data) => {
            gameManager.toggleReady(socket, io, data);
        });

        // Start game
        socket.on('start_game', (data) => {
            gameManager.startGame(socket, io, data);
        });

        // Submit night action
        socket.on('night_action', (data) => {
            gameManager.submitNightAction(socket, io, data);
        });

        // Submit vote
        socket.on('vote', (data) => {
            gameManager.submitVote(socket, io, data);
        });

        // Chat message
        socket.on('chat_message', (data) => {
            gameManager.handleChatMessage(socket, io, data);
        });

        // Wasp chat (private team chat)
        socket.on('wasp_chat', (data) => {
            gameManager.handleWaspChat(socket, io, data);
        });

        // Dead chat
        socket.on('dead_chat', (data) => {
            gameManager.handleDeadChat(socket, io, data);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.username}`);
            lobbyManager.leaveLobby(socket, io);
            gameManager.handleDisconnect(socket, io);
        });
    });

    console.log('✅ Socket.io handlers initialized');
}

module.exports = { initializeSocketHandlers };
