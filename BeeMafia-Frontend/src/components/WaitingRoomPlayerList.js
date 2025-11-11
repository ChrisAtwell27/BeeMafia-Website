import React, { useState, useEffect } from 'react';
import './WaitingRoomPlayerList.css';

function WaitingRoomPlayerList({ players, isHost, socket, gameId, playerRoleAssignments = {} }) {
  const [assignments, setAssignments] = useState(playerRoleAssignments);
  const [availableRoles, setAvailableRoles] = useState({});

  // Update local state when prop changes (from socket updates)
  useEffect(() => {
    setAssignments(playerRoleAssignments);
  }, [playerRoleAssignments]);

  // Fetch available roles from backend
  useEffect(() => {
    if (!socket) return;

    socket.emit('get_role_config', { gameId });

    const handleRoleConfig = (data) => {
      if (data.availableRoles && data.availableRoles.ROLES) {
        setAvailableRoles(data.availableRoles.ROLES);
      }
    };

    socket.on('role_config_updated', handleRoleConfig);

    return () => {
      socket.off('role_config_updated', handleRoleConfig);
    };
  }, [socket, gameId]);

  // Get all available role keys
  const roleKeys = Object.keys(availableRoles);

  // Generate consistent color for each player based on their username
  const getPlayerColor = (username) => {
    if (!username) return '#94a3b8';

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash >> 8) % 20);
    const lightness = 55 + (Math.abs(hash >> 16) % 15);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleRoleAssignment = (playerId, roleKey) => {
    if (!isHost) return;

    // Update local state immediately for responsiveness
    const newAssignments = { ...assignments, [playerId]: roleKey };
    setAssignments(newAssignments);

    // Emit to server
    socket.emit('assign_role', {
      gameId,
      playerId,
      roleKey: roleKey || null // null means unassign
    });
  };

  return (
    <div className="waiting-room-player-list">
      <h3>
        Players ({players?.length || 0})
        {isHost && <span className="host-hint"> - Click to assign roles</span>}
      </h3>
      <div className="waiting-players-grid">
        {players.map((player) => {
          const playerColor = getPlayerColor(player.username);
          const assignedRole = assignments[player.id] || assignments[player.userId];
          const roleInfo = assignedRole ? availableRoles[assignedRole] : null;

          return (
            <div
              key={player.userId || player.id}
              className="waiting-player-card"
            >
              <div className="player-info">
                <div className="player-name" style={{ color: playerColor }}>
                  {player.username}
                  {player.isBot && ' 🤖'}
                </div>

                {isHost ? (
                  <div className="role-assignment">
                    <select
                      value={assignedRole || ''}
                      onChange={(e) => handleRoleAssignment(player.id || player.userId, e.target.value)}
                      className="role-select"
                    >
                      <option value="">🎲 Random Role</option>
                      {roleKeys.map(roleKey => (
                        <option key={roleKey} value={roleKey}>
                          {availableRoles[roleKey].emoji} {availableRoles[roleKey].name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : assignedRole && roleInfo ? (
                  <div className="assigned-role-display">
                    {roleInfo.emoji} {roleInfo.name}
                  </div>
                ) : (
                  <div className="assigned-role-display random">
                    🎲 Random
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <div className="assignment-info">
          <p>💡 Players without assigned roles will receive random roles based on the game mode.</p>
          {Object.keys(assignments).length > 0 && (
            <button
              onClick={() => {
                setAssignments({});
                socket.emit('clear_role_assignments', { gameId });
              }}
              className="btn-clear-assignments"
            >
              Clear All Assignments
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default WaitingRoomPlayerList;
