import React from 'react';
import './PlayerList.css';

function PlayerList({ players }) {
  return (
    <div className="player-list">
      <h3>Players ({players?.length || 0})</h3>
      <div className="players-grid">
        {players?.map((player) => (
          <div
            key={player.userId || player.id}
            className={`player-card ${player.alive === false ? 'dead' : 'alive'}`}
          >
            <div className="player-name">{player.username}</div>
            {player.alive === false && <div className="player-status">💀 Dead</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;
