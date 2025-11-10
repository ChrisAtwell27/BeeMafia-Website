import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';

function ChatBox({ gameId, socket, phase, myRole, gameEvents = [], isAlive = true }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // chat or log
  const messagesEndRef = useRef(null);

  const isWasp = myRole && myRole.team === 'wasp';
  const isZombee = myRole && myRole.team === 'zombee';
  const isDead = !isAlive;
  const isMason = myRole && myRole.id === 'mason';
  const isJailor = myRole && myRole.id === 'jailor';
  const isMedium = myRole && (myRole.id === 'MEDIUM_BEE' || myRole.id === 'medium');

  // Generate consistent color for each player based on their username
  const getPlayerColor = (username) => {
    if (!username) return '#0ea5e9';

    // Hash function to generate consistent color from username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate HSL color with good saturation and lightness for readability
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
    const lightness = 55 + (Math.abs(hash >> 16) % 15); // 55-70%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Backward compatibility for old chat events
    socket.on('wasp_chat', (data) => {
      setMessages((prev) => [...prev, { ...data, channel: 'wasp' }]);
    });

    socket.on('dead_chat', (data) => {
      setMessages((prev) => [...prev, { ...data, channel: 'dead' }]);
    });

    return () => {
      socket.off('chat_message');
      socket.off('wasp_chat');
      socket.off('dead_chat');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, gameEvents]);

  // Determine if the current player can see a message
  const canSeeMessage = (msg) => {
    // Check visibility tag
    const visibilityTag = msg.visibilityTag;

    if (!visibilityTag) {
      // No tag means everyone can see (day/voting chat)
      return true;
    }

    switch (visibilityTag) {
      case 'dead':
        // Dead players and Medium (during night) can see dead messages
        return isDead || (isMedium && phase === 'night');

      case 'wasp':
        // Only wasps can see wasp messages
        return isWasp;

      case 'zombee':
        // Only zombees can see zombee messages
        return isZombee;

      case 'mason':
        // Only masons can see mason messages
        return isMason;

      case 'jailor':
        // Jailor and jailed prisoner can see jailor messages
        return isJailor; // TODO: add jailed player check

      default:
        return false;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('chat_message', {
      message: inputMessage,
      channel: 'all' // Everything goes to all channel
    });

    setInputMessage('');
  };

  // Filter messages that the player can see
  const visibleMessages = messages.filter(canSeeMessage);

  // Merge game events and chat messages, then sort by timestamp
  const mergedMessages = [
    ...gameEvents.map(event => ({ ...event, isGameEvent: true })),
    ...visibleMessages.map(msg => ({ ...msg, isGameEvent: false }))
  ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const getEventIcon = (type) => {
    switch (type) {
      case 'death': return '💀';
      case 'phase_change': return '🔄';
      case 'vote': return '🗳️';
      case 'role_action': return '✨';
      case 'game_start': return '🎮';
      case 'game_end': return '🏆';
      default: return '📌';
    }
  };

  const getVisibilityDisplay = (visibilityTag) => {
    if (!visibilityTag) {
      return { emoji: '💬', label: 'All', color: '#cbd5e1' };
    }

    switch (visibilityTag) {
      case 'wasp': return { emoji: '🦟', label: 'Wasp', color: '#ff6b6b' };
      case 'zombee': return { emoji: '🧟', label: 'Zombee', color: '#22c55e' };
      case 'dead': return { emoji: '👻', label: 'Dead', color: '#9ca3af' };
      case 'jailor': return { emoji: '⛓️', label: 'Jailor', color: '#a78bfa' };
      case 'mason': return { emoji: '🔨', label: 'Mason', color: '#60a5fa' };
      default: return { emoji: '💬', label: 'All', color: '#cbd5e1' };
    }
  };

  // Dead players can always chat in "all" channel (only dead players see their messages)
  // Living players can chat during day/voting, or in special channels
  const canChat = isDead || phase === 'day' || phase === 'voting' || (isWasp && phase === 'night') || (isZombee && phase === 'night') || (isMedium && phase === 'night') || isMason || isJailor;

  return (
    <div className="chat-box">
      <div className="chat-tabs">
        <button
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={activeTab === 'log' ? 'active' : ''}
          onClick={() => setActiveTab('log')}
        >
          📜 Game Log
        </button>
      </div>

      <div className="chat-messages">
        {activeTab === 'log' ? (
          gameEvents.map((event, index) => (
            <div key={index} className={`game-event event-${event.type}`}>
              <span className="event-icon">{getEventIcon(event.type)}</span>
              <span className="event-message">{event.message}</span>
            </div>
          ))
        ) : (
          mergedMessages.map((item, index) => {
            if (item.isGameEvent) {
              // Render game event
              return (
                <div key={`event-${index}`} className={`game-event event-${item.type}`}>
                  <span className="event-icon">{getEventIcon(item.type)}</span>
                  <span className="event-message">{item.message}</span>
                </div>
              );
            } else {
              // Render chat message
              const visibilityInfo = getVisibilityDisplay(item.visibilityTag);
              const usernameColor = getPlayerColor(item.username);
              const visibilityClass = item.visibilityTag ? `visibility-${item.visibilityTag}` : '';
              return (
                <div key={`msg-${index}`} className={`chat-message ${visibilityClass}`}>
                  <span className="message-channel" style={{ color: visibilityInfo.color }}>
                    {visibilityInfo.emoji}
                  </span>
                  <span className="message-username" style={{ color: usernameColor }}>{item.username}:</span>
                  <span className="message-text">{item.message}</span>
                </div>
              );
            }
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {activeTab === 'chat' && (
        <div>
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={canChat ? 'Type a message...' : 'Chat is disabled during this phase'}
              disabled={!canChat}
            />
            <button type="submit" disabled={!canChat}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
