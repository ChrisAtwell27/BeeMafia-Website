import React from 'react';
import './PlayerList.css';

function PlayerList({ players, myRole, currentUsername }) {
  // Sort players: alive players first, then dead players
  const sortedPlayers = [...(players || [])].sort((a, b) => {
    // alive = true/undefined comes before alive = false
    if (a.alive === false && b.alive !== false) return 1;
    if (a.alive !== false && b.alive === false) return -1;
    return 0;
  });

  // Check if player is a team member
  const isTeamMember = (player) => {
    if (!myRole || !myRole.teamMembers) return false;
    return myRole.teamMembers.some(tm => tm.id === player.id || tm.id === player.userId);
  };

  // Check if player is current user
  const isCurrentPlayer = (player) => {
    return player.username === currentUsername;
  };

  // Generate consistent color for each player based on their username
  const getPlayerColor = (username) => {
    if (!username) return '#94a3b8';

    // Hash function to generate consistent color from username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate HSL color with good saturation and lightness for readability
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
    const lightness = 55 + (Math.abs(hash >> 16) % 15); // 55-70%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <div className="player-list">
      <h3>Players ({players?.length || 0})</h3>
      <div className="players-grid">
        {sortedPlayers.map((player) => {
          const isTeam = isTeamMember(player);
          const isSelf = isCurrentPlayer(player);
          const playerColor = getPlayerColor(player.username);

          return (
            <div
              key={player.userId || player.id}
              className={`player-card ${player.alive === false ? 'dead' : 'alive'} ${isTeam ? 'team-member' : ''} ${isSelf ? 'self' : ''}`}
            >
              <div className="player-name" style={{ color: playerColor }}>
                {player.username}
              </div>
              {player.alive === false && <div className="player-status">💀 Dead</div>}
              {isTeam && <div className="player-team-badge">🤝 Teammate</div>}
              {isSelf && <div className="player-self-badge">⭐ You</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlayerList;
