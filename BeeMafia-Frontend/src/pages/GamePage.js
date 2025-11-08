import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ChatBox from '../components/ChatBox';
import PlayerList from '../components/PlayerList';
import RoleCard from '../components/RoleCard';
import NightActionPanel from '../components/NightActionPanel';
import VotingPanel from '../components/VotingPanel';
import PhaseIndicator from '../components/PhaseIndicator';
import GameEventLog from '../components/GameEventLog';
import './GamePage.css';

function GamePage() {
  const { gameId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState({
    phase: 'waiting',
    players: [],
    isHost: false,
    nightNumber: 0
  });

  const [myRole, setMyRole] = useState(null);
  const [showRole, setShowRole] = useState(false);
  const [phaseTimer, setPhaseTimer] = useState(null);
  const [gameEvents, setGameEvents] = useState([]);

  // Helper to add events to the log
  const addEvent = (type, message) => {
    setGameEvents((prev) => [...prev, { type, message, timestamp: Date.now() }]);
  };

  useEffect(() => {
    if (!socket) return;

    // Request current game state
    socket.emit('join_game', { gameId });

    socket.on('joined_game', (data) => {
      // Initialize game state when we successfully join
      setGameState({
        phase: data.game.status === 'waiting' ? 'waiting' : 'playing',
        players: data.game.players,
        isHost: data.game.host === user?.username,
        debugMode: data.game.debugMode || false,
        nightNumber: 0
      });
    });

    socket.on('player_joined_game', (data) => {
      setGameState((prev) => ({
        ...prev,
        players: data.players
      }));
      toast.info(`${data.player.username} joined the game`);
    });

    socket.on('player_left_game', (data) => {
      setGameState((prev) => ({
        ...prev,
        players: data.players
      }));
      toast.info(`${data.player.username} left the game`);
    });

    socket.on('game_started', (data) => {
      setGameState((prev) => ({
        ...prev,
        phase: data.phase
      }));
      toast.success('Game started! Check your role');
      addEvent('game_start', 'The game has begun! Roles have been assigned.');
    });

    socket.on('role_assigned', (data) => {
      setMyRole(data);
      setShowRole(true);
      setTimeout(() => setShowRole(false), 10000); // Hide after 10 seconds
    });

    socket.on('phase_changed', (data) => {
      setGameState((prev) => ({
        ...prev,
        phase: data.phase,
        nightNumber: data.nightNumber || prev.nightNumber,
        alivePlayers: data.alivePlayers,
        votingTargets: data.votingTargets
      }));
      setPhaseTimer(data.duration);

      if (data.phase === 'night') {
        toast.info(`Night ${data.nightNumber} begins`);
        addEvent('phase_change', `Night ${data.nightNumber} has fallen. Players perform their night actions.`);
      } else if (data.phase === 'day') {
        toast.info('Day phase begins - Discuss!');
        addEvent('phase_change', 'Day has broken. Discuss what happened during the night.');
      } else if (data.phase === 'voting') {
        toast.info('Voting phase - Vote to eliminate someone');
        addEvent('phase_change', 'Voting phase begins. Vote to eliminate a suspect.');
      }
    });

    socket.on('night_results', (data) => {
      if (data.deaths && data.deaths.length > 0) {
        data.deaths.forEach((death) => {
          toast.error(`${death.username} was ${death.reason}`);
          addEvent('death', `${death.username} was ${death.reason} during the night.`);
        });
      } else {
        toast.info('Nobody died last night');
        addEvent('action', 'Nobody died during the night.');
      }
    });

    socket.on('investigation_result', (data) => {
      let message = '';
      if (data.type === 'suspicious') {
        message = `🔍 Investigation: ${data.target} appears ${data.result}!`;
      } else if (data.type === 'exact') {
        message = `🔍 Investigation: ${data.target} is a ${data.result}!`;
      } else if (data.type === 'lookout') {
        message = `👁️ Lookout: ${data.target} was visited by ${data.result}`;
      } else if (data.type === 'track') {
        message = `👣 Track: ${data.target} visited ${data.result}`;
      }
      toast.info(message, { autoClose: 8000 });
      addEvent('investigation', `You learned: ${message}`);
    });

    socket.on('player_lynched', (data) => {
      toast.error(`${data.player.username} was lynched! They were ${data.role} (${data.team})`);
      addEvent('lynch', `${data.player.username} was lynched! They were ${data.role} (${data.team})`);
    });

    socket.on('no_lynch', (data) => {
      toast.info(data.message);
      addEvent('no_lynch', data.message);
    });

    socket.on('game_ended', (data) => {
      const wonGame = data.winners.some((w) => w.username === user.username);
      toast.success(
        wonGame ? `You won! Winner: ${data.winnerType}` : `Game over! Winner: ${data.winnerType}`,
        { autoClose: 10000 }
      );
      addEvent('game_end', `Game Over! ${data.winnerType} wins!`);
      setTimeout(() => navigate('/lobby'), 15000);
    });

    socket.on('error', (data) => {
      toast.error(data.message);
    });

    return () => {
      // Only clean up event listeners - don't leave the game here
      // The game will be left when user clicks Leave button or disconnects
      socket.off('joined_game');
      socket.off('player_joined_game');
      socket.off('player_left_game');
      socket.off('game_started');
      socket.off('role_assigned');
      socket.off('phase_changed');
      socket.off('night_results');
      socket.off('investigation_result');
      socket.off('player_lynched');
      socket.off('no_lynch');
      socket.off('game_ended');
      socket.off('error');
    };
  }, [socket, gameId, navigate, user]);

  // Timer countdown
  useEffect(() => {
    if (phaseTimer === null) return;

    const interval = setInterval(() => {
      setPhaseTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseTimer]);

  const handleStartGame = () => {
    socket.emit('start_game', { gameId, preset: 'basic' });
  };

  const handleLeaveGame = () => {
    socket.emit('leave_game', { gameId });
    navigate('/lobby');
  };

  return (
    <div className="game-page">
      <header className="game-header">
        <div>
          <h1>🐝 BeeMafia</h1>
          <p className="game-phase">
            Phase: <strong>{gameState.phase.toUpperCase()}</strong>
            {gameState.nightNumber > 0 && ` (Night ${gameState.nightNumber})`}
          </p>
        </div>
        <div className="header-actions">
          {phaseTimer !== null && <span className="timer">⏱️ {phaseTimer}s</span>}
          {gameState.isHost && gameState.phase === 'waiting' && (
            <button onClick={handleStartGame} className="btn-primary">
              Start Game
            </button>
          )}
          <button onClick={handleLeaveGame} className="btn-secondary">
            Leave
          </button>
        </div>
      </header>

      <div className="game-content">
        <div className="game-main">
          {/* Phase Indicator - shows current phase and instructions */}
          {gameState.phase !== 'waiting' && (
            <PhaseIndicator
              phase={gameState.phase}
              nightNumber={gameState.nightNumber}
              timer={phaseTimer}
              myRole={myRole}
            />
          )}

          <PlayerList players={gameState.players} />

          {myRole && showRole && (
            <div className="role-reveal">
              <RoleCard role={myRole} />
            </div>
          )}

          {myRole && !showRole && (
            <button onClick={() => setShowRole(!showRole)} className="btn-toggle-role">
              {showRole ? 'Hide Role' : 'Show My Role'}
            </button>
          )}

          {gameState.phase === 'night' && myRole && (
            <NightActionPanel
              role={myRole}
              targets={gameState.alivePlayers}
              gameId={gameId}
              socket={socket}
            />
          )}

          {gameState.phase === 'voting' && (
            <VotingPanel
              targets={gameState.votingTargets}
              gameId={gameId}
              socket={socket}
            />
          )}

          {gameState.phase === 'waiting' && (
            <div className="waiting-room">
              <h2>Waiting for players...</h2>
              {gameState.debugMode ? (
                <>
                  <p>🐛 Debug Mode: Solo testing enabled - start anytime!</p>
                  <p>Current players: {gameState.players.length}</p>
                  {gameState.players.length < 6 && (
                    <p className="bot-info">🤖 Bots will auto-fill to 6 players when game starts</p>
                  )}
                  <div className="debug-features">
                    <h3>Debug Features:</h3>
                    <ul>
                      <li>✅ Intelligent bot AI with role-based behavior</li>
                      <li>✅ Instant phase transitions (5s night, 10s day, 8s vote)</li>
                      <li>✅ Bot chat messages for realism</li>
                      <li>✅ Smart bot voting patterns</li>
                      <li>✅ Auto-fill to 6 players when starting</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p>Need at least 6 players to start</p>
                  <p>Current players: {gameState.players.length}</p>
                </>
              )}
            </div>
          )}

          {/* Debug Controls Panel for Host */}
          {gameState.debugMode && gameState.isHost && gameState.phase !== 'waiting' && (
            <div className="debug-controls">
              <h3>🐛 Debug Controls (Host Only)</h3>
              <div className="debug-buttons">
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'skip_phase' });
                    toast.info('Skipping to next phase...');
                  }}
                  className="btn-debug"
                >
                  ⏭️ Skip Phase
                </button>
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'reveal_roles' });
                  }}
                  className="btn-debug"
                >
                  👁️ Reveal All Roles
                </button>
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'force_win', team: 'bee' });
                  }}
                  className="btn-debug btn-bee"
                >
                  🐝 Force Bee Win
                </button>
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'force_win', team: 'wasp' });
                  }}
                  className="btn-debug btn-wasp"
                >
                  🦟 Force Wasp Win
                </button>
              </div>
              <p className="debug-info">Phase timers: Night 5s, Day 10s, Vote 8s</p>
            </div>
          )}

          {/* Game Event Log */}
          {gameState.phase !== 'waiting' && (
            <GameEventLog events={gameEvents} />
          )}
        </div>

        <div className="game-sidebar">
          <ChatBox gameId={gameId} socket={socket} phase={gameState.phase} myRole={myRole} />
        </div>
      </div>

      {showRole && (
        <div className="role-modal-overlay" onClick={() => setShowRole(false)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <RoleCard role={myRole} detailed />
            <button onClick={() => setShowRole(false)} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;
