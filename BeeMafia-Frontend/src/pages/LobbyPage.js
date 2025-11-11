import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import NewsSection from '../components/NewsSection';
import soundManager from '../utils/soundManager';
import './LobbyPage.css';

function LobbyPage() {
  const { username, logout, isAuthenticated } = useAuth();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      gameMode: 'custom',
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
          {isAuthenticated && (
            <button
              onClick={() => navigate('/role-builder')}
              className="btn-create-roles"
              title="Create custom roles"
            >
              🎨 Create Roles
            </button>
          )}
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
                    <p className="debug-info">⚡ DEBUG MODE: Manual bots, fast timers</p>
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
                      Manual bot addition (Add Bots button), fast timers (10s setup, 45s night, 90s day, 60s vote), 1 player to start
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

      {/* Discord Section - Below Main Content */}
      <div className="discord-lobby-section">
        <div className="discord-lobby-card">
          <div className="discord-icon">
            <svg width="40" height="40" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
            </svg>
          </div>
          <h3>Voice Chat Available!</h3>
          <p>Join our Discord for <strong>voice chat integration</strong></p>
          <a
            href="https://discord.gg/mTvFpxNe58"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-discord-lobby"
          >
            Join Discord →
          </a>
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