import React from 'react';
import './GameEventLog.css';

function GameEventLog({ events }) {
  const getEventIcon = (type) => {
    switch (type) {
      case 'death':
        return '💀';
      case 'investigation':
        return '🔍';
      case 'vote':
        return '🗳️';
      case 'lynch':
        return '⚖️';
      case 'no_lynch':
        return '🤝';
      case 'phase_change':
        return '🔄';
      case 'game_start':
        return '🎮';
      case 'game_end':
        return '🏆';
      case 'action':
        return '⚡';
      default:
        return '📋';
    }
  };

  const getEventClass = (type) => {
    switch (type) {
      case 'death':
      case 'lynch':
        return 'event-danger';
      case 'investigation':
        return 'event-info';
      case 'vote':
        return 'event-warning';
      case 'no_lynch':
        return 'event-success';
      case 'game_end':
        return 'event-highlight';
      default:
        return 'event-normal';
    }
  };

  return (
    <div className="game-event-log">
      <div className="event-log-header">
        <h3>📜 Game Log</h3>
        <span className="event-count">{events.length} events</span>
      </div>
      <div className="event-log-content">
        {events.length === 0 ? (
          <div className="no-events">
            <p>No events yet. The game will begin soon...</p>
          </div>
        ) : (
          <div className="event-list">
            {events.map((event, index) => (
              <div key={index} className={`event-item ${getEventClass(event.type)}`}>
                <span className="event-icon">{getEventIcon(event.type)}</span>
                <div className="event-details">
                  <span className="event-message">{event.message}</span>
                  {event.timestamp && (
                    <span className="event-time">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameEventLog;
