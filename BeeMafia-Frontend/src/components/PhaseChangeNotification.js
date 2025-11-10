import React, { useEffect, useState } from 'react';
import './PhaseChangeNotification.css';

function PhaseChangeNotification({ phase, nightNumber, isFullMoon }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'night':
        return {
          icon: isFullMoon ? '🌕' : '🌙',
          title: `Night ${nightNumber}${isFullMoon ? ' - Full Moon' : ''}`,
          subtitle: isFullMoon ? 'The Werebee is on the hunt!' : 'Perform your night actions',
          color: isFullMoon ? '#fbbf24' : '#475569'
        };
      case 'day':
        return {
          icon: '☀️',
          title: 'Day Phase',
          subtitle: 'Discuss what happened',
          color: '#fbbf24'
        };
      case 'voting':
        return {
          icon: '⚖️',
          title: 'Voting Phase',
          subtitle: 'Vote to eliminate someone',
          color: '#ef4444'
        };
      default:
        return null;
    }
  };

  const phaseInfo = getPhaseDisplay();
  if (!phaseInfo) return null;

  return (
    <div className="phase-notification">
      <div className="phase-notification-card" style={{ borderColor: phaseInfo.color }}>
        <div className="phase-notification-icon">{phaseInfo.icon}</div>
        <div className="phase-notification-content">
          <h2 className="phase-notification-title" style={{ color: phaseInfo.color }}>
            {phaseInfo.title}
          </h2>
          <p className="phase-notification-subtitle">{phaseInfo.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default PhaseChangeNotification;
