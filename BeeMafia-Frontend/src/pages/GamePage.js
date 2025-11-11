import React, { useState, useEffect, useRef } from 'react';
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
import RoleConfigTab from '../components/RoleConfigTab';
import Notes from '../components/Notes';
import PhaseChangeNotification from '../components/PhaseChangeNotification';
import NightEventNotification from '../components/NightEventNotification';
import MorningSummary from '../components/MorningSummary';
import PersonalMorningPopup from '../components/PersonalMorningPopup';
import WinScreen from '../components/WinScreen';
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
  const [phaseNotificationKey, setPhaseNotificationKey] = useState(0);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [winData, setWinData] = useState(null);
  const [nightEvent, setNightEvent] = useState(null);
  const [nightEventKey, setNightEventKey] = useState(0);
  const [lastNightDeaths, setLastNightDeaths] = useState(null);
  const [showMorningSummary, setShowMorningSummary] = useState(false);
  const [morningSummaryKey, setMorningSummaryKey] = useState(0);
  const [investigationResults, setInvestigationResults] = useState([]);
  const [showPersonalMorning, setShowPersonalMorning] = useState(false);
  const [personalMorningKey, setPersonalMorningKey] = useState(0);

  // Track shown night events to prevent duplicates
  const shownNightEventsRef = useRef(new Set());
  // Track current night number for event deduplication
  const currentNightNumberRef = useRef(0);

  // Phase duration settings (in seconds)
  const [phaseDurations, setPhaseDurations] = useState({
    setup: 30,
    night: 60,
    day: 180,
    voting: 120
  });

  // Helper to add events to the log
  const addEvent = (type, message) => {
    setGameEvents((prev) => [...prev, { type, message, timestamp: Date.now() }]);
  };

  // Helper to get user-friendly message for night events
  const getEventMessage = (event) => {
    switch (event.type) {
      case 'roleblocked': return 'You were roleblocked! Your action was prevented.';
      case 'attacked': return 'You were attacked but survived!';
      case 'healed': return 'A Nurse Bee saved you from death!';
      case 'protected': return 'You were protected by a Guard Bee!';
      case 'jailed': return 'You were jailed by the Jailor!';
      case 'poisoned': return 'You were poisoned! You will die in 2 nights unless healed.';
      case 'cured': return 'A Nurse cured your poison!';
      case 'killed': return `You died! ${event.reason || ''}`;
      default: return event.message || 'Something happened to you';
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Request current game state
    socket.emit('join_game', { gameId });

    socket.on('joined_game', (data) => {
      // Initialize game state when we successfully join
      const isDebugMode = data.game.debugMode || false;
      setGameState({
        phase: data.game.status === 'waiting' ? 'waiting' : 'playing',
        players: data.game.players,
        isHost: data.game.host === user?.username,
        debugMode: isDebugMode,
        nightNumber: 0
      });

      // Set default phase durations based on debug mode
      if (isDebugMode) {
        setPhaseDurations({
          setup: 10,
          night: 45,
          day: 90,
          voting: 60
        });
      }
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

    socket.on('bots_added', (data) => {
      toast.success(`🤖 Added ${data.count} bot${data.count > 1 ? 's' : ''}! Total players: ${data.totalPlayers}`);
    });

    socket.on('role_assigned', (data) => {
      setMyRole(data);
      setShowRole(true);
      setTimeout(() => setShowRole(false), 10000); // Hide after 10 seconds
    });

    socket.on('role_changed', (data) => {
      setMyRole(data);
      setShowRole(true);
      toast.warning(`🧟 You have been infected! You are now a ${data.role}!`, { autoClose: 8000 });
      setTimeout(() => setShowRole(false), 12000); // Hide after 12 seconds
    });

    socket.on('phase_changed', (data) => {
      setGameState((prev) => ({
        ...prev,
        phase: data.phase,
        players: data.players || prev.players, // Update players with alive status
        nightNumber: data.nightNumber || prev.nightNumber,
        alivePlayers: data.alivePlayers,
        votingTargets: data.votingTargets,
        isFullMoon: data.isFullMoon || false
      }));
      setPhaseTimer(data.duration);

      // Update night number ref for event deduplication
      if (data.nightNumber !== undefined) {
        currentNightNumberRef.current = data.nightNumber;
      }

      // Clear shown night events when day starts (for next night's events)
      if (data.phase === 'day') {
        shownNightEventsRef.current.clear();
      }

      // Show phase notification by incrementing key to force remount
      setPhaseNotificationKey(prev => prev + 1);

      // Note: Morning summary logic moved to useEffect to handle timing issues

      // Show voting modal after phase notification (for voting phase) - only if alive
      if (data.phase === 'voting') {
        setTimeout(() => {
          const currentPlayer = data.players?.find(p => p.username === user?.username);
          const isAlive = currentPlayer?.alive ?? true;
          if (isAlive) {
            setShowVotingModal(true);
          }
        }, 3000);
      } else {
        setShowVotingModal(false);
      }

      if (data.phase === 'night') {
        addEvent('phase_change', `Night ${data.nightNumber} has fallen. Players perform their night actions.`);
      } else if (data.phase === 'day') {
        addEvent('phase_change', 'Day has broken. Discuss what happened during the night.');
      } else if (data.phase === 'voting') {
        addEvent('phase_change', 'Voting phase begins. Vote to eliminate a suspect.');
      }
    });

    socket.on('night_results', (data) => {
      // Store deaths for morning summary (shown when day phase starts)
      setLastNightDeaths(data.deaths || []);

      // Add to event log
      if (data.deaths && data.deaths.length > 0) {
        data.deaths.forEach((death) => {
          // Determine death message based on killer information
          let deathMessage = '';
          if (death.killedBy && death.killedBy !== 'unknown') {
            deathMessage = `${death.username} was killed by ${death.killedBy} during the night.`;
          } else if (death.killedByTeam && death.killedByTeam !== 'unknown') {
            deathMessage = `${death.username} was killed by ${death.killedByTeam}s during the night.`;
          } else if (death.reason === 'poisoned') {
            deathMessage = `${death.username} died from poison during the night.`;
          } else if (death.reason === 'guilt') {
            deathMessage = `${death.username} died from guilt.`;
          } else if (death.reason === 'died protecting') {
            deathMessage = `${death.username} died protecting someone.`;
          } else if (death.reason === 'killed by bodyguard') {
            deathMessage = `${death.username} was killed by a Bodyguard.`;
          } else {
            deathMessage = `${death.username} was ${death.reason} during the night.`;
          }
          addEvent('death', deathMessage);
        });
      } else {
        addEvent('action', 'Nobody died during the night.');
      }
    });

    socket.on('investigation_result', (data) => {
      let message = '';
      let icon = '🔍';

      if (data.type === 'suspicious') {
        message = `${data.target} appears ${data.result}!`;
        icon = '🔍';
      } else if (data.type === 'exact') {
        message = `${data.target} is a ${data.result}!`;
        icon = '🔍';
      } else if (data.type === 'lookout') {
        message = data.result && data.result !== 'nobody'
          ? `${data.target} was visited by ${data.result}`
          : `${data.target} had no visitors`;
        icon = '👁️';
      } else if (data.type === 'track') {
        message = data.result && data.result !== 'nobody'
          ? `${data.target} visited ${data.result}`
          : `${data.target} stayed home`;
        icon = '👣';
      } else if (data.type === 'psychic') {
        message = data.result;
        icon = '🔮';
      } else if (data.type === 'beekeeper') {
        message = data.result;
        icon = '🐝';
      } else if (data.result) {
        // Generic handler for other investigation types
        message = data.result;
        icon = '🔍';
      }

      if (message) {
        // Store for personal morning popup
        setInvestigationResults(prev => [...prev, { icon, message, type: data.type }]);
        addEvent('investigation', `You learned: ${icon} ${message}`);
      }
    });

    socket.on('night_event', (event) => {
      // Only show if we haven't shown this type of event for this night already
      const eventTypeId = `${event.type}_${currentNightNumberRef.current}`;
      if (!shownNightEventsRef.current.has(eventTypeId)) {
        shownNightEventsRef.current.add(eventTypeId);

        // Show notification popup
        setNightEvent(event);
        setNightEventKey((prev) => prev + 1);

        // Also show toast for important events
        if (event.type === 'killed') {
          toast.error('💀 You died!', { autoClose: 5000 });
        } else if (event.type === 'poisoned') {
          toast.error('☠️ You were poisoned! You will die in 2 nights unless healed.', { autoClose: 7000 });
        }
      }

      // Log event (always log, even if we don't show popup)
      addEvent(event.type, getEventMessage(event));
    });

    socket.on('vote_cast', (data) => {
      addEvent('vote', `${data.voter} voted for ${data.target}`);
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
      const wonGame = data.winners.some((w) => w.username === user?.username);
      toast.success(
        wonGame ? `You won! Winner: ${data.winnerType}` : `Game over! Winner: ${data.winnerType}`,
        { autoClose: 5000 }
      );
      addEvent('game_end', `Game Over! ${data.winnerType} wins!`);

      // Show win screen instead of navigating away
      setWinData(data);
      setGameState((prev) => ({ ...prev, phase: 'finished' }));
    });

    socket.on('returned_to_lobby', (data) => {
      // Reset game state back to waiting
      setWinData(null);
      setMyRole(null);
      setShowRole(false);
      setGameState({
        phase: 'waiting',
        players: data.players,
        isHost: data.players.find(p => p.username === user?.username)?.isHost || false,
        nightNumber: 0
      });
      toast.info('Returned to lobby');
      addEvent('lobby_return', 'Game returned to lobby. Ready for next match!');
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
      socket.off('bots_added');
      socket.off('role_assigned');
      socket.off('role_changed');
      socket.off('phase_changed');
      socket.off('night_results');
      socket.off('investigation_result');
      socket.off('night_event');
      socket.off('vote_cast');
      socket.off('player_lynched');
      socket.off('no_lynch');
      socket.off('game_ended');
      socket.off('returned_to_lobby');
      socket.off('error');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, gameId]);

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

  // Handle morning popups when day phase starts and deaths/investigations are available
  useEffect(() => {
    if (gameState.phase !== 'day' || lastNightDeaths === null) return;

    // Show personal morning popup first if there are investigation results
    if (investigationResults.length > 0 && !showPersonalMorning) {
      const timer = setTimeout(() => {
        setShowPersonalMorning(true);
        setPersonalMorningKey(prev => prev + 1);
      }, 4500); // Show after night events (which show for 4 seconds)
      return () => clearTimeout(timer);
    }
    // If no investigation results, show morning summary directly
    else if (investigationResults.length === 0 && !showMorningSummary && lastNightDeaths) {
      const timer = setTimeout(() => {
        setShowMorningSummary(true);
        setMorningSummaryKey(prev => prev + 1);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, lastNightDeaths, investigationResults.length, showPersonalMorning, showMorningSummary]);

  const handleStartGame = () => {
    socket.emit('start_game', {
      gameId,
      preset: 'basic',
      customDurations: phaseDurations
    });
  };

  const handleAddBots = () => {
    socket.emit('add_bots', { gameId, count: 11 });
  };

  const handlePhaseDurationChange = (phase, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 600) {
      setPhaseDurations(prev => ({
        ...prev,
        [phase]: numValue
      }));
    }
  };

  const handleResetDurations = () => {
    if (gameState.debugMode) {
      setPhaseDurations({
        setup: 10,
        night: 45,
        day: 90,
        voting: 60
      });
    } else {
      setPhaseDurations({
        setup: 30,
        night: 60,
        day: 180,
        voting: 120
      });
    }
    toast.info('Phase durations reset to defaults');
  };

  const handleLeaveGame = () => {
    socket.emit('leave_game', { gameId });
    navigate('/lobby');
  };

  const handleReturnToLobby = () => {
    socket.emit('return_to_lobby', { gameId });
  };

  const handleClosePersonalMorning = () => {
    setShowPersonalMorning(false);
    setInvestigationResults([]);

    // Show morning summary after personal popup is closed (if there are deaths)
    if (lastNightDeaths !== null) {
      setShowMorningSummary(true);
      setMorningSummaryKey(prev => prev + 1);
    }
  };

  const handleCloseMorningSummary = () => {
    setShowMorningSummary(false);
    setLastNightDeaths(null);
  };

  return (
    <div className="game-page">
      {/* Top Bar with Phase Information */}
      <header className="game-header">
        <div className="header-left">
          <button onClick={handleLeaveGame} className="btn-secondary">
            Leave
          </button>
        </div>

        <div className="header-center">
          {gameState.phase !== 'waiting' ? (
            <PhaseIndicator
              phase={gameState.phase}
              nightNumber={gameState.nightNumber}
              timer={phaseTimer}
              myRole={myRole}
            />
          ) : (
            <div className="phase-info">
              <h1>🐝 BeeMafia</h1>
              <p className="game-phase">Waiting for players...</p>
            </div>
          )}
        </div>

        <div className="header-right">
          {gameState.isHost && gameState.phase === 'waiting' && (
            <>
              {gameState.debugMode && (
                <button onClick={handleAddBots} className="btn-warning" title="Add 11 bots to fill the lobby">
                  🤖 Add Bots
                </button>
              )}
              <button onClick={handleStartGame} className="btn-primary">
                Start Game
              </button>
            </>
          )}
        </div>
      </header>

      <div className="game-content">
        {/* Left Sidebar - Players */}
        <div className="game-sidebar-left">
          <PlayerList players={gameState.players} myRole={myRole} currentUsername={user?.username} />

          {/* Debug Controls Panel for Host */}
          {gameState.debugMode && gameState.isHost && gameState.phase !== 'waiting' && (
            <div className="debug-controls">
              <h3>🐛 Debug Controls</h3>
              <div className="debug-buttons">
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'skip_phase' });
                    toast.info('Skipping to next phase...');
                  }}
                  className="btn-debug"
                >
                  ⏭️ Skip
                </button>
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'reveal_roles' });
                  }}
                  className="btn-debug"
                >
                  👁️ Roles
                </button>
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'force_win', team: 'bee' });
                  }}
                  className="btn-debug btn-bee"
                >
                  🐝 Bee Win
                </button>
                <button
                  onClick={() => {
                    socket.emit('debug_command', { gameId, command: 'force_win', team: 'wasp' });
                  }}
                  className="btn-debug btn-wasp"
                >
                  🦟 Wasp Win
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center - Chat */}
        <div className="game-main">
          {gameState.phase === 'waiting' ? (
            <div className="waiting-room">
              <h2>Waiting for players...</h2>
              {gameState.debugMode ? (
                <>
                  <p>🐛 Debug Mode: Solo testing enabled - start with 1+ players!</p>
                  <p>Current players: {gameState.players.length}</p>
                  {gameState.isHost && gameState.players.length < 12 && (
                    <p className="bot-info">🤖 Click "Add Bots" button to fill the lobby instantly</p>
                  )}
                  <div className="debug-features">
                    <h3>Debug Features:</h3>
                    <ul>
                      <li>✅ Intelligent bot AI with role-based behavior</li>
                      <li>✅ Fast phase transitions (check Phase Timers →)</li>
                      <li>✅ Bot chat messages for realism</li>
                      <li>✅ Smart bot voting patterns</li>
                      <li>✅ Manual bot addition via button</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p>Need at least 6 players to start</p>
                  <p>Current players: {gameState.players.length}</p>
                </>
              )}

              {/* Role Configuration Tab */}
              <RoleConfigTab
                gameState={gameState}
                socket={socket}
                gameId={gameId}
              />
            </div>
          ) : (
            <ChatBox
              gameId={gameId}
              socket={socket}
              phase={gameState.phase}
              myRole={myRole}
              gameEvents={gameEvents}
              isAlive={gameState.players.find(p => p.username === user?.username)?.alive ?? true}
            />
          )}
        </div>

        {/* Right Sidebar - Role, Actions, Notes */}
        <div className="game-sidebar-right">
          {/* Phase Timers Info (Waiting Phase) */}
          {gameState.phase === 'waiting' && (
            <div className="phase-timers-info">
              <div className="timer-header">
                <h3>⏱️ Phase Timers</h3>
                {gameState.isHost && (
                  <button
                    onClick={handleResetDurations}
                    className="btn-reset-timers"
                    title="Reset to defaults"
                  >
                    ↺
                  </button>
                )}
              </div>
              <div className="timers-display">
                {gameState.isHost ? (
                  <>
                    <div className="timer-edit-row">
                      <label className="timer-label">Setup:</label>
                      <div className="timer-input-group">
                        <input
                          type="number"
                          min="5"
                          max="600"
                          value={phaseDurations.setup}
                          onChange={(e) => handlePhaseDurationChange('setup', e.target.value)}
                          className="timer-input"
                        />
                        <span className="timer-unit">seconds</span>
                      </div>
                    </div>
                    <div className="timer-edit-row">
                      <label className="timer-label">Night:</label>
                      <div className="timer-input-group">
                        <input
                          type="number"
                          min="10"
                          max="600"
                          value={phaseDurations.night}
                          onChange={(e) => handlePhaseDurationChange('night', e.target.value)}
                          className="timer-input"
                        />
                        <span className="timer-unit">seconds</span>
                      </div>
                    </div>
                    <div className="timer-edit-row">
                      <label className="timer-label">Day:</label>
                      <div className="timer-input-group">
                        <input
                          type="number"
                          min="30"
                          max="600"
                          value={phaseDurations.day}
                          onChange={(e) => handlePhaseDurationChange('day', e.target.value)}
                          className="timer-input"
                        />
                        <span className="timer-unit">seconds</span>
                      </div>
                    </div>
                    <div className="timer-edit-row">
                      <label className="timer-label">Voting:</label>
                      <div className="timer-input-group">
                        <input
                          type="number"
                          min="20"
                          max="600"
                          value={phaseDurations.voting}
                          onChange={(e) => handlePhaseDurationChange('voting', e.target.value)}
                          className="timer-input"
                        />
                        <span className="timer-unit">seconds</span>
                      </div>
                    </div>
                    <div className="timer-note">
                      {gameState.debugMode ? (
                        <span>🐛 Debug defaults: 10s, 45s, 90s, 60s</span>
                      ) : (
                        <span>📝 Normal defaults: 30s, 60s, 180s, 120s</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="timer-row">
                      <div className="timer-label">Setup:</div>
                      <div className="timer-value">{phaseDurations.setup}s</div>
                    </div>
                    <div className="timer-row">
                      <div className="timer-label">Night:</div>
                      <div className="timer-value">{phaseDurations.night}s</div>
                    </div>
                    <div className="timer-row">
                      <div className="timer-label">Day:</div>
                      <div className="timer-value">{phaseDurations.day}s</div>
                    </div>
                    <div className="timer-row">
                      <div className="timer-label">Voting:</div>
                      <div className="timer-value">{phaseDurations.voting}s</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Role Info */}
          {myRole && gameState.phase !== 'waiting' && (
            <div className="role-info-compact">
              <div className="role-info-header">
                <h3>Your Role</h3>
                <button onClick={() => setShowRole(true)} className="btn-view-role">
                  View Details
                </button>
              </div>
              <div className="role-info-content">
                <div className="role-name-display">
                  <span className="role-emoji">{myRole.emoji}</span>
                  <span className="role-name">{myRole.role}</span>
                </div>
                <div className="role-team" style={{ color: myRole.team === 'bee' ? '#87CEEB' : myRole.team === 'wasp' ? '#ff6b6b' : '#FFD700' }}>
                  {myRole.team === 'bee' ? '🐝 Bee Team' : myRole.team === 'wasp' ? '🦟 Wasp Team' : '⚖️ Neutral'}
                </div>
              </div>
            </div>
          )}

          {/* Role Ability Usage */}
          {gameState.phase === 'night' && myRole && (
            <NightActionPanel
              role={myRole}
              targets={gameState.alivePlayers}
              gameId={gameId}
              socket={socket}
            />
          )}

          {/* Notes Area */}
          {gameState.phase !== 'waiting' && (
            <Notes gameId={gameId} />
          )}
        </div>
      </div>

      {/* Role Detail Modal */}
      {showRole && myRole && (
        <div className="role-modal-overlay" onClick={() => setShowRole(false)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <RoleCard role={myRole} detailed />
            <button onClick={() => setShowRole(false)} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Phase Change Notification */}
      {phaseNotificationKey > 0 && (
        <PhaseChangeNotification
          key={phaseNotificationKey}
          phase={gameState.phase}
          nightNumber={gameState.nightNumber}
          isFullMoon={gameState.isFullMoon}
        />
      )}

      {/* Night Event Notification */}
      {nightEventKey > 0 && nightEvent && (
        <NightEventNotification
          key={nightEventKey}
          event={nightEvent}
        />
      )}

      {/* Personal Morning Popup - shows first with investigation results */}
      {showPersonalMorning && personalMorningKey > 0 && investigationResults.length > 0 && (
        <PersonalMorningPopup
          key={personalMorningKey}
          investigations={investigationResults}
          onClose={handleClosePersonalMorning}
        />
      )}

      {/* Morning Summary - shows after personal popup or directly after night events */}
      {showMorningSummary && morningSummaryKey > 0 && lastNightDeaths && (
        <MorningSummary
          key={morningSummaryKey}
          deaths={lastNightDeaths}
          onClose={handleCloseMorningSummary}
        />
      )}

      {/* Voting Modal */}
      {showVotingModal && gameState.phase === 'voting' && (
        <VotingPanel
          targets={gameState.votingTargets}
          gameId={gameId}
          socket={socket}
          isModal={true}
          onVoteSubmit={() => setShowVotingModal(false)}
        />
      )}

      {/* Win Screen */}
      {winData && (
        <WinScreen
          winData={winData}
          onClose={handleReturnToLobby}
          isHost={gameState.isHost}
        />
      )}
    </div>
  );
}

export default GamePage;
