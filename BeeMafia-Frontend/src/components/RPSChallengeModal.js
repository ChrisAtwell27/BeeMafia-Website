import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './RPSChallengeModal.css';

function RPSChallengeModal({ challengerName, socket, onClose }) {
  const [selectedChoice, setSelectedChoice] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedChoice) {
      toast.error('Please choose rock, paper, or scissors');
      return;
    }

    socket.emit('rps_response', {
      choice: selectedChoice
    });

    setSubmitted(true);
    toast.success('Response submitted!');

    // Close modal after a short delay
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="rps-modal-overlay">
      <div className="rps-modal-content">
        <div className="rps-modal-header">
          <h2>🏴‍☠️ Pirate Duel Challenge!</h2>
        </div>

        <div className="rps-modal-body">
          <p className="challenge-text">
            <strong>{challengerName}</strong> has challenged you to a duel!
          </p>
          <p className="challenge-instruction">
            Choose your move quickly! The duel will be resolved at the end of dusk.
          </p>

          <div className="rps-choice-container">
            <button
              type="button"
              className={`rps-choice-button ${selectedChoice === 'rock' ? 'selected' : ''}`}
              onClick={() => setSelectedChoice('rock')}
              disabled={submitted}
            >
              <span className="rps-emoji">✊</span>
              <span className="rps-label">Rock</span>
            </button>
            <button
              type="button"
              className={`rps-choice-button ${selectedChoice === 'paper' ? 'selected' : ''}`}
              onClick={() => setSelectedChoice('paper')}
              disabled={submitted}
            >
              <span className="rps-emoji">✋</span>
              <span className="rps-label">Paper</span>
            </button>
            <button
              type="button"
              className={`rps-choice-button ${selectedChoice === 'scissors' ? 'selected' : ''}`}
              onClick={() => setSelectedChoice('scissors')}
              disabled={submitted}
            >
              <span className="rps-emoji">✌️</span>
              <span className="rps-label">Scissors</span>
            </button>
          </div>
        </div>

        <div className="rps-modal-footer">
          {!submitted ? (
            <>
              <button
                className="btn-rps-submit"
                onClick={handleSubmit}
                disabled={!selectedChoice}
              >
                Submit Response
              </button>
              <button
                className="btn-rps-cancel"
                onClick={onClose}
              >
                Decline (Auto-Lose)
              </button>
            </>
          ) : (
            <p className="submitted-message">
              ✓ Response submitted! The duel will be resolved soon...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RPSChallengeModal;
