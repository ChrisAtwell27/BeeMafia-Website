import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './VotingPanel.css';

function VotingPanel({ targets, gameId, socket, isModal = false, onVoteSubmit }) {
  const [selectedVote, setSelectedVote] = useState('');
  const [voted, setVoted] = useState(false);

  const handleVote = (targetId) => {
    socket.emit('vote', { target: targetId });
    setSelectedVote(targetId);
    setVoted(true);
    toast.success(voted ? 'Vote changed!' : 'Vote submitted!');

    // Call callback if provided (for modal)
    if (onVoteSubmit) {
      onVoteSubmit();
    }
  };

  const content = (
    <>
      <h3>⚖️ Voting Phase</h3>
      <p className="voting-description">Vote to eliminate someone or skip</p>

      <div className="voting-options">
        {targets?.map((target) => (
          <button
            key={target.id}
            onClick={() => handleVote(target.id)}
            className={`vote-button ${selectedVote === target.id ? 'selected' : ''}`}
          >
            {target.username}
          </button>
        ))}
        <button
          onClick={() => handleVote('skip')}
          className={`vote-button skip-button ${selectedVote === 'skip' ? 'selected' : ''}`}
        >
          Skip Vote
        </button>
      </div>

      {voted && <p className="voted-message">✓ Your vote has been recorded (you can change it)</p>}
    </>
  );

  if (isModal) {
    return (
      <div className="voting-modal-overlay">
        <div className="voting-modal">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="voting-panel">
      {content}
    </div>
  );
}

export default VotingPanel;
