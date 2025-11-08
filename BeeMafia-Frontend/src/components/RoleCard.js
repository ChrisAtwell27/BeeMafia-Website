import React from 'react';
import './RoleCard.css';

function RoleCard({ role, detailed = false }) {
  if (!role) return null;

  const getTeamColor = (team) => {
    switch (team) {
      case 'bee':
        return '#FFD700'; // Gold
      case 'wasp':
        return '#DC143C'; // Crimson
      case 'neutral':
        return '#808080'; // Gray
      default:
        return '#FFFFFF';
    }
  };

  return (
    <div
      className={`role-card ${detailed ? 'detailed' : 'compact'}`}
      style={{ borderColor: getTeamColor(role.team) }}
    >
      <div className="role-header">
        <span className="role-emoji">{role.emoji}</span>
        <h3 className="role-name">{role.role}</h3>
      </div>

      <div className="role-team" style={{ backgroundColor: getTeamColor(role.team) }}>
        {role.team.toUpperCase()}
      </div>

      {detailed && (
        <>
          <div className="role-description">
            <p>{role.description}</p>
          </div>

          <div className="role-abilities">
            <h4>Abilities:</h4>
            <ul>
              {role.abilities?.map((ability, index) => (
                <li key={index}>{ability}</li>
              ))}
            </ul>
          </div>

          <div className="role-win-condition">
            <h4>Win Condition:</h4>
            <p>{role.winCondition}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default RoleCard;
