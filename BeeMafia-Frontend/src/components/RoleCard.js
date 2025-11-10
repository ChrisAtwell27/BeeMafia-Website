import React from 'react';
import ReactMarkdown from 'react-markdown';
import './RoleCard.css';

function RoleCard({ role, detailed = false }) {
  if (!role) return null;

  const getTeamColor = (team) => {
    switch (team) {
      case 'bee':
        return '#87CEEB'; // Sky Blue
      case 'wasp':
        return '#ff6b6b'; // Soft Red
      case 'neutral':
        return '#FFD700'; // Gold
      default:
        return '#FFFFFF';
    }
  };

  const getTeamLabel = (team) => {
    switch (team) {
      case 'bee':
        return '🐝 Bee Team';
      case 'wasp':
        return '🦟 Wasp Team';
      case 'neutral':
        return '⚖️ Neutral';
      default:
        return team;
    }
  };

  // Handle both role.role and role.name for compatibility
  const roleName = role.role || role.name;

  return (
    <div
      className={`role-card ${detailed ? 'detailed' : 'compact'}`}
      style={{ borderColor: getTeamColor(role.team) }}
    >
      <div className="role-header">
        <span className="role-emoji">{role.emoji}</span>
        <h3 className="role-name">{roleName}</h3>
        <div className="role-team" style={{
          backgroundColor: getTeamColor(role.team),
          color: role.team === 'neutral' ? '#000' : '#fff'
        }}>
          {getTeamLabel(role.team)}
        </div>
      </div>

      {role.teamMembers && role.teamMembers.length > 0 && (
        <div className="role-team-members">
          <h4>🤝 Your Teammates</h4>
          <div className="team-members-list">
            {role.teamMembers.map((member) => (
              <div key={member.id} className="team-member-item">
                <span className="team-member-name">{member.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailed && (
        <>
          <div className="role-description">
            <ReactMarkdown>{role.description}</ReactMarkdown>
          </div>

          {role.abilities && role.abilities.length > 0 && (
            <div className="role-abilities">
              <h4>💫 Abilities</h4>
              <ul>
                {role.abilities.map((ability, index) => (
                  <li key={index}>
                    <ReactMarkdown>{ability}</ReactMarkdown>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {role.winCondition && (
            <div className="role-win-condition">
              <h4>🎯 Win Condition</h4>
              <div className="win-condition-text">
                <ReactMarkdown>{role.winCondition}</ReactMarkdown>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RoleCard;
