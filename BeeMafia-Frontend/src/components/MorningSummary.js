import React from 'react';
import './MorningSummary.css';

function MorningSummary({ deaths, onClose }) {
  if (!deaths) return null;

  return (
    <div className="morning-summary">
      <div className="morning-summary-card">
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        <div className="morning-summary-header">
          <span className="morning-icon">☀️</span>
          <h2 className="morning-title">Morning Report</h2>
        </div>

        <div className="morning-summary-content">
          {deaths.length === 0 ? (
            <div className="no-deaths">
              <span className="celebration-icon">🎉</span>
              <p className="no-deaths-text">No one died last night!</p>
            </div>
          ) : (
            <div className="deaths-list">
              <p className="deaths-header">
                {deaths.length === 1 ? '1 player died:' : `${deaths.length} players died:`}
              </p>
              {deaths.map((death, index) => {
                // Determine what to display as the killer
                let killerText = '';
                if (death.killedBy && death.killedBy !== 'unknown') {
                  killerText = `killed by ${death.killedBy}`;
                } else if (death.killedByTeam && death.killedByTeam !== 'unknown') {
                  killerText = `killed by ${death.killedByTeam}s`;
                } else if (death.reason === 'poisoned') {
                  killerText = 'died from poison';
                } else if (death.reason === 'guilt') {
                  killerText = 'died from guilt';
                } else if (death.reason === 'died protecting') {
                  killerText = 'died protecting someone';
                } else if (death.reason === 'killed by bodyguard') {
                  killerText = 'killed by Bodyguard';
                } else if (death.reason !== 'killed') {
                  killerText = death.reason;
                }

                return (
                  <div key={index} className="death-entry">
                    <span className="death-icon">💀</span>
                    <span className="death-name">{death.username}</span>
                    {killerText && (
                      <span className="death-reason">({killerText})</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MorningSummary;
