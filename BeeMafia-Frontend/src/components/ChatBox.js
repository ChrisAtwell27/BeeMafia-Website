import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';

function ChatBox({ gameId, socket, phase, myRole }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, wasp, dead
  const messagesEndRef = useRef(null);

  const isWasp = myRole && myRole.team === 'wasp';
  const isDead = false; // You'd track this from game state

  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'all' }]);
    });

    socket.on('wasp_chat', (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'wasp' }]);
    });

    socket.on('dead_chat', (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'dead' }]);
    });

    return () => {
      socket.off('chat_message');
      socket.off('wasp_chat');
      socket.off('dead_chat');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    if (activeTab === 'wasp' && isWasp) {
      socket.emit('wasp_chat', { message: inputMessage });
    } else if (activeTab === 'dead' && isDead) {
      socket.emit('dead_chat', { message: inputMessage });
    } else {
      socket.emit('chat_message', { message: inputMessage });
    }

    setInputMessage('');
  };

  const filteredMessages = messages.filter((msg) => {
    if (activeTab === 'all') return msg.type === 'all';
    if (activeTab === 'wasp') return msg.type === 'wasp';
    if (activeTab === 'dead') return msg.type === 'dead';
    return true;
  });

  return (
    <div className="chat-box">
      <div className="chat-tabs">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Chat
        </button>
        {isWasp && (
          <button
            className={activeTab === 'wasp' ? 'active' : ''}
            onClick={() => setActiveTab('wasp')}
          >
            🐝 Wasp
          </button>
        )}
        {isDead && (
          <button
            className={activeTab === 'dead' ? 'active' : ''}
            onClick={() => setActiveTab('dead')}
          >
            👻 Dead
          </button>
        )}
      </div>

      <div className="chat-messages">
        {filteredMessages.map((msg, index) => (
          <div key={index} className="chat-message">
            <span className="message-username">{msg.username}:</span>
            <span className="message-text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={phase === 'night' || phase === 'waiting'}
        />
        <button type="submit" disabled={phase === 'night' || phase === 'waiting'}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
