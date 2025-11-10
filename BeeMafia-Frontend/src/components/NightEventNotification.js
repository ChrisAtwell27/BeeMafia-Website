import React, { useEffect, useState } from 'react';
import './NightEventNotification.css';

function NightEventNotification({ event }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 4 seconds (slightly longer than phase notifications)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible || !event) return null;

  const getEventDisplay = () => {
    switch (event.type) {
      case 'roleblocked':
        return {
          icon: '🚫',
          title: 'Roleblocked!',
          subtitle: 'Someone prevented your action',
          color: '#ef4444'
        };
      case 'attacked':
        return {
          icon: '⚔️',
          title: 'You Were Attacked!',
          subtitle: 'But you survived',
          color: '#f59e0b'
        };
      case 'healed':
        return {
          icon: '💚',
          title: 'You Were Healed!',
          subtitle: 'A Nurse saved you from death',
          color: '#10b981'
        };
      case 'protected':
        return {
          icon: '🛡️',
          title: 'You Were Protected!',
          subtitle: 'A Guard Bee kept you safe',
          color: '#3b82f6'
        };
      case 'jailed':
        return {
          icon: '⛓️',
          title: 'You Were Jailed!',
          subtitle: 'The Jailor has detained you',
          color: '#8b5cf6'
        };
      case 'poisoned':
        return {
          icon: '☠️',
          title: 'You Were Poisoned!',
          subtitle: 'You will die in 2 nights unless healed',
          color: '#22c55e'
        };
      case 'cured':
        return {
          icon: '✨',
          title: 'Poison Cured!',
          subtitle: 'A Nurse cured your poison',
          color: '#14b8a6'
        };
      case 'killed':
        return {
          icon: '💀',
          title: 'You Died!',
          subtitle: event.reason || 'You were killed',
          color: '#dc2626'
        };
      case 'muted':
        return {
          icon: '🤐',
          title: 'You Were Muted!',
          subtitle: 'You cannot speak today',
          color: '#6366f1'
        };
      case 'infected':
        return {
          icon: '🧟',
          title: 'You Were Infected!',
          subtitle: 'You are now a Zombee',
          color: '#22c55e'
        };
      case 'infection_resisted':
        return {
          icon: '🛡️',
          title: 'Infection Resisted!',
          subtitle: 'Your defense protected you from infection',
          color: '#3b82f6'
        };
      default:
        return {
          icon: '📌',
          title: event.title || 'Event',
          subtitle: event.message || '',
          color: '#64748b'
        };
    }
  };

  const eventInfo = getEventDisplay();

  return (
    <div className="night-event-notification">
      <div className="night-event-card" style={{ borderColor: eventInfo.color }}>
        <div className="night-event-icon" style={{ color: eventInfo.color }}>
          {eventInfo.icon}
        </div>
        <div className="night-event-content">
          <h2 className="night-event-title" style={{ color: eventInfo.color }}>
            {eventInfo.title}
          </h2>
          <p className="night-event-subtitle">{eventInfo.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default NightEventNotification;
