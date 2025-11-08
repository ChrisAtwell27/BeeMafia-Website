import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import NewsSection from '../components/NewsSection';
import soundManager from '../utils/soundManager';
import './LobbyPage.css';

function LobbyPage() {
  const { username, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // States for games and lobby
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);

  // States for create room form (now inline)
  const [gameName, setGameName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [gameMode, setGameMode] = useState('basic');
  const [debugMode, setDebugMode] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState('');


  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingJoinGame, setPendingJoinGame] = useState(null);
  const [enteredCode, setEnteredCode] = useState('');

  // Check for room code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlRoomCode = params.get('room');
    if (urlRoomCode) {
      // Auto-join room with code
      handleJoinWithCode(urlRoomCode);
    }
  }, [location]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // F5 - Refresh (prevent default browser refresh)
      if (e.key === 'F5') {
        e.preventDefault();
        handleRefresh();
      }
      // Ctrl+N - Create new room
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        // Focus on room name input in create section
        const roomNameInput = document.querySelector('.create-room-section input');
        if (roomNameInput) {
          roomNameInput.focus();
          roomNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      // Ctrl+F - Focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('join_lobby');

    socket.on('lobby_state', (data) => {
      console.log('📥 Received lobby_state:', data.games?.length, 'games');
      setGames(data.games || []);
      setOnlineCount(data.onlineCount || 0);
    });

    socket.on('lobby_games_update', (data) => {
      console.log('📥 Received lobby_games_update:', data.games?.length, 'games');
      setGames(data.games || []);
      setOnlineCount(data.onlineCount || 0);
    });

    socket.on('game_created', (data) => {
      soundManager.playSuccess();
      toast.success('Game created!');
      if (data.roomCode) {
        setRoomCode(data.roomCode);
        // Show room code to creator
        toast.info(`Room Code: ${data.roomCode}`);
      }
      navigate(`/game/${data.gameId}`);
    });

    socket.on('joined_game', (data) => {
      soundManager.playJoin();
      navigate(`/game/${data.gameId}`);
    });

    socket.on('join_game_error', (data) => {
      soundManager.playError();
      toast.error(data.error || 'Failed to join game');
      setShowPasswordModal(false);
      setPendingJoinGame(null);
    });

    return () => {
      socket.off('lobby_state');
      socket.off('lobby_games_update');
      socket.off('game_created');
      socket.off('joined_game');
      socket.off('join_game_error');
    };
  }, [socket, connected, navigate]);

  // Filter games based on search term
  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return games;

    const term = searchTerm.toLowerCase();
    return games.filter(game =>
      game.name.toLowerCase().includes(term) ||
      game.host.toLowerCase().includes(term)
    );
  }, [games, searchTerm]);

  // Count of private rooms
  const privateGamesCount = games.filter(g => g.isPrivate).length;

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const handleCreateGame = () => {
    const trimmedName = gameName.trim() || `${username}'s room`;

    socket.emit('create_game', {
      name: trimmedName,
      maxPlayers,
      gameMode,
      debugMode,
      isPrivate
    });

    // Reset form
    setGameName('');
    setIsPrivate(false);
  };

  const handleJoinGame = (game) => {
    if (game.isPrivate) {
      setPendingJoinGame(game);
      setShowPasswordModal(true);
    } else {
      socket.emit('join_game', { gameId: game.gameId });
    }
  };

  const handleJoinWithCode = (code) => {
    const game = games.find(g => g.roomCode === code.toUpperCase());
    if (game) {
      socket.emit('join_game', {
        gameId: game.gameId,
        roomCode: code.toUpperCase()
      });
    } else {
      toast.error('Invalid room code');
    }
  };

  const handlePasswordSubmit = () => {
    if (!enteredCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    socket.emit('join_game', {
      gameId: pendingJoinGame.gameId,
      roomCode: enteredCode.toUpperCase()
    });
    setEnteredCode('');
  };

  const handleRefresh = () => {
    soundManager.playClick();
    socket.emit('join_lobby');
    toast.success('Refreshed room list');
  };


  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <h1>🐝 BeeMafia</h1>
        <div className="header-center">
          <span className="online-count">
            🟢 {onlineCount} {onlineCount === 1 ? 'Player' : 'Players'} Online
          </span>
        </div>
        <div className="user-info">
          <span>Playing as: <strong>{username}</strong></span>
          <button
            onClick={() => {
              const newState = !soundEnabled;
              setSoundEnabled(newState);
              soundManager.setEnabled(newState);
              soundManager.playClick();
            }}
            className="btn-sound"
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={logout} className="btn-secondary">
            Change Username
          </button>
        </div>
      </header>

      <div className="lobby-content">
        {/* NEWS Section */}
        <NewsSection />

        {/* JOIN A ROOM Section */}
        <div className="join-room-section">
          <div className="join-room-header">
            <h2>JOIN A ROOM</h2>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Filter rooms by name or host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={handleRefresh} className="btn-refresh">
                Refresh
              </button>
            </div>
          </div>

          {!connected && (
            <div className="connection-warning">
              <p>⚠️ Connecting to server...</p>
            </div>
          )}

          {connected && filteredGames.length === 0 && (
            <div className="no-games">
              <p>{searchTerm ? 'No games match your search.' : 'No public rooms found. Why don\'t you make one?'}</p>
            </div>
          )}

          <div className="games-list">
            {filteredGames.map((game) => (
              <div
                key={game.gameId}
                className={`game-card ${game.isPrivate ? 'private-room' : ''}`}
              >
                <div className="game-info">
                  <h3>
                    {game.isPrivate && <span className="lock-icon">🔒</span>}
                    {game.name}
                    {game.debugMode && <span className="debug-badge">DEBUG</span>}
                  </h3>
                  <p>
                    <span className="game-host">{game.host}</span> •
                    Mode: {game.gameMode} •
                    {game.isPrivate ? ' Private Room' : ' Public Room'}
                  </p>
                  {game.debugMode && (
                    <p className="debug-info">⚡ Fast timers, 2+ players to start</p>
                  )}
                </div>
                <div className="game-actions">
                  <span className="player-count">
                    {game.players}/{game.maxPlayers}
                  </span>
                  <button
                    onClick={() => handleJoinGame(game)}
                    className="btn-join"
                    disabled={game.players >= game.maxPlayers}
                  >
                    {game.players >= game.maxPlayers ? 'Full' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {privateGamesCount > 0 && (
            <div className="unlisted-info">
              {privateGamesCount} unlisted room{privateGamesCount !== 1 ? 's' : ''} not shown
            </div>
          )}
        </div>

        {/* CREATE A NEW ROOM Section */}
        <div className="create-room-section">
          <div className="create-room-header">
            <h2>CREATE A NEW ROOM</h2>
          </div>
          <div className="create-room-form">
            <div className="form-group">
              <label>Room name</label>
              <input
                type="text"
                className="form-input"
                placeholder={`${username}'s room`}
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
            </div>

            <div className="checkbox-container">
              <input
                type="checkbox"
                id="private-room"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <div>
                <label htmlFor="private-room" className="checkbox-label">
                  Private
                </label>
                <div className="private-info">
                  If private, your room will not appear on the public rooms list.
                  You will have to share the room's URL with other players.
                </div>
              </div>
            </div>

            {/* Additional options (hidden for now, can be expanded) */}
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ color: '#b0b0b0', cursor: 'pointer', userSelect: 'none' }}>
                Advanced Options
              </summary>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Max Players</label>
                  <input
                    type="number"
                    className="form-input"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    min="6"
                    max="20"
                  />
                </div>
                <div className="form-group">
                  <label>Game Mode</label>
                  <select
                    className="form-input"
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value)}
                  >
                    <option value="basic">Basic</option>
                    <option value="chaos">Chaos</option>
                    <option value="investigative">Investigative</option>
                    <option value="killing">Killing</option>
                  </select>
                </div>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="debug-mode"
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                  />
                  <div>
                    <label htmlFor="debug-mode" className="checkbox-label">
                      Debug Mode
                    </label>
                    <div className="private-info">
                      Fast timers (10s setup, 45s night, 90s day, 60s vote) and only 2 players needed
                    </div>
                  </div>
                </div>
              </div>
            </details>

            <button
              onClick={handleCreateGame}
              className="btn-create"
              disabled={!connected}
            >
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal for Private Rooms */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enter Room Code</h2>
              <button
                className="btn-close"
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-group">
              <label>This is a private room. Enter the room code to join:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-character code"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace' }}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button onClick={handlePasswordSubmit} className="btn-primary">
                Join Room
              </button>
              <button onClick={() => setShowPasswordModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Code Display Modal (shown after creating private room) */}
      {roomCode && (
        <div className="modal-overlay" onClick={() => setRoomCode('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Private Room Created!</h2>
              <button className="btn-close" onClick={() => setRoomCode('')}>×</button>
            </div>
            <div className="room-code-display">
              <div className="room-code-label">Room Code:</div>
              <div className="room-code">{roomCode}</div>
              <button
                className="copy-button"
                onClick={() => {
                  const url = `${window.location.origin}/lobby?room=${roomCode}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Room link copied!');
                }}
              >
                Copy Room Link
              </button>
            </div>
            <p style={{ color: '#808080', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Share this code or link with players to let them join your private room
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LobbyPage;