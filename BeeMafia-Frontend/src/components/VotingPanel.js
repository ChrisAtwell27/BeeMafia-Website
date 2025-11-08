import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './VotingPanel.css';

function VotingPanel({ targets, gameId, socket }) {
  const [selectedVote, setSelectedVote] = useState('');
  const [voted, setVoted] = useState(false);

  const handleVote = (targetId) => {
    socket.emit('vote', { target: targetId });
    setSelectedVote(targetId);
    setVoted(true);
    toast.success('Vote submitted!');
  };

  return (
    <div className="voting-panel">
      <h3>⚖️ Voting Phase</h3>
      <p>Vote to eliminate someone or skip</p>

      <div className="voting-options">
        {targets?.map((target) => (
          <button
            key={target.id}
            onClick={() => handleVote(target.id)}
            disabled={voted}
            className={`vote-button ${selectedVote === target.id ? 'selected' : ''}`}
          >
            {target.username}
          </button>
        ))}
        <button
          onClick={() => handleVote('skip')}
          disabled={voted}
          className={`vote-button skip-button ${selectedVote === 'skip' ? 'selected' : ''}`}
        >
          Skip Vote
        </button>
      </div>

      {voted && <p className="voted-message">✓ Your vote has been recorded</p>}
    </div>
  );
}

export default VotingPanel;
