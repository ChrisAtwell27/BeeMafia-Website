import React from 'react';
import './PhaseIndicator.css';

function PhaseIndicator({ phase, myRole, timer, nightNumber }) {
  const getPhaseInfo = () => {
    switch (phase) {
      case 'waiting':
        return {
          title: 'Waiting for Players',
          description: 'Waiting for the host to start the game...',
          icon: '⏳',
          color: '#94a3b8'
        };
      case 'night':
        return {
          title: `Night ${nightNumber}`,
          description: myRole?.nightAction
            ? '🌙 Use your night ability below. Choose your target wisely!'
            : '🌙 You have no night action. Wait for the night to end...',
          icon: '🌙',
          color: '#1e3a8a'
        };
      case 'day':
        return {
          title: 'Day Discussion',
          description: '☀️ Discuss what happened last night. Share information and suspicions!',
          icon: '☀️',
          color: '#f59e0b'
        };
      case 'voting':
        return {
          title: 'Voting Phase',
          description: '⚖️ Vote to eliminate a player you suspect is evil!',
          icon: '⚖️',
          color: '#dc2626'
        };
      case 'finished':
        return {
          title: 'Game Over',
          description: '🏁 The game has ended!',
          icon: '🏁',
          color: '#8b5cf6'
        };
      default:
        return {
          title: 'Unknown Phase',
          description: '',
          icon: '❓',
          color: '#6b7280'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="phase-indicator" style={{ borderColor: phaseInfo.color }}>
      <div className="phase-header">
        <span className="phase-icon">{phaseInfo.icon}</span>
        <h2 className="phase-title" style={{ color: phaseInfo.color }}>{phaseInfo.title}</h2>
        {timer && <span className="phase-timer">{timer}s</span>}
      </div>
      <p className="phase-description">{phaseInfo.description}</p>

      {myRole && phase !== 'waiting' && (
        <div className="your-role-reminder">
          <span className="role-icon">{myRole.emoji}</span>
          <span className="role-name">You are a {myRole.role}</span>
        </div>
      )}
    </div>
  );
}

export default PhaseIndicator;
