import React from 'react';
import './WinScreen.css';

function WinScreen({ winData, onClose, isHost }) {
  if (!winData) return null;

  const { winnerType, winners, allPlayers } = winData;

  // Determine team emoji and color
  const getTeamDisplay = (type) => {
    switch(type) {
      case 'bee':
        return { emoji: '🐝', name: 'Bee Team', color: '#87CEEB' };
      case 'wasp':
        return { emoji: '🦟', name: 'Wasp Team', color: '#ff6b6b' };
      case 'neutral':
        return { emoji: '⚖️', name: 'Neutral', color: '#FFD700' };
      default:
        return { emoji: '🎮', name: type, color: '#FFD700' };
    }
  };

  const teamDisplay = getTeamDisplay(winnerType);

  return (
    <div className="win-screen-overlay">
      <div className="win-screen-modal">
        {/* Victory Banner */}
        <div className="victory-banner" style={{ borderColor: teamDisplay.color }}>
          <div className="victory-icon" style={{ color: teamDisplay.color }}>
            {teamDisplay.emoji}
          </div>
          <h1 className="victory-title">Victory!</h1>
          <h2 className="victory-team" style={{ color: teamDisplay.color }}>
            {teamDisplay.name} Wins!
          </h2>
        </div>

        {/* Winners List */}
        <div className="winners-section">
          <h3>🏆 Winners</h3>
          <div className="winners-list">
            {winners.map((winner, index) => (
              <div key={index} className="winner-item">
                <span className="winner-username">{winner.username}</span>
                <span className="winner-role">{winner.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All Players */}
        <div className="all-players-section">
          <h3>📋 Final Results</h3>
          <div className="all-players-list">
            {allPlayers.map((player, index) => (
              <div key={index} className={`player-item ${player.team}`}>
                <span className="player-username">
                  {player.survived ? '✓' : '💀'} {player.username}
                </span>
                <span className="player-role">{player.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button - Only for Host */}
        {isHost && (
          <button className="btn-return-lobby" onClick={onClose}>
            Return to Lobby
          </button>
        )}

        {!isHost && (
          <div className="waiting-message">
            Waiting for host to return to lobby...
          </div>
        )}
      </div>
    </div>
  );
}

export default WinScreen;
