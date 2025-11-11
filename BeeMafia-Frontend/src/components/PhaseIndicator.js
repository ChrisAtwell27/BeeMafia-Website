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
      case 'setup':
        return {
          title: 'Setup Phase',
          description: myRole?.duskAction
            ? '🌅 Game is starting! Use your dawn ability and prepare your strategy.'
            : '🌅 Game is starting! Check your role and prepare your strategy.',
          icon: '🌅',
          color: '#f97316'
        };
      case 'dusk':
        return {
          title: 'Dusk',
          description: myRole?.duskAction
            ? '🌅 Use your dusk ability below. Select your target before night falls!'
            : '🌅 You have no dusk action. Wait for night to begin...',
          icon: '🌅',
          color: '#ea580c'
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
    <div className="phase-indicator">
      <span className="phase-icon">{phaseInfo.icon}</span>
      <span className="phase-title" style={{ color: phaseInfo.color }}>{phaseInfo.title}</span>
      {timer && <span className="phase-timer">{timer}s</span>}
    </div>
  );
}

export default PhaseIndicator;
