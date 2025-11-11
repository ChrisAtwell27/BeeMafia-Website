import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './NightActionPanel.css'; // Reuse the same styling

function DuskActionPanel({ role, targets, gameId, socket }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [rpsChoice, setRpsChoice] = useState(''); // For pirate duel
  const [submitted, setSubmitted] = useState(false);

  if (!role.duskAction) {
    return (
      <div className="night-action-panel no-action">
        <div className="no-action-content">
          <span className="no-action-icon">🌅</span>
          <h3>No Dusk Action</h3>
          <p>You have no ability to use at dusk. Wait for the dusk phase to end.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selectedTarget) {
      toast.error('Please select a target');
      return;
    }

    // For pirate duel, require RPS choice
    if (role.actionType === 'pirate_duel' && !rpsChoice) {
      toast.error('Please choose rock, paper, or scissors');
      return;
    }

    socket.emit('dusk_action', {
      action: role.actionType,
      target: selectedTarget,
      rpsChoice: rpsChoice || undefined // Only send if pirate
    });

    toast.success(submitted ? 'Action changed!' : 'Action submitted!');
    setSubmitted(true);
  };

  // Get instruction based on role
  const getInstruction = () => {
    switch (role.actionType) {
      case 'jail':
        return 'Select a player to jail tonight. They will be roleblocked and protected from attacks. You can talk with them.';
      case 'pirate_duel':
        return 'Challenge a player to rock-paper-scissors! Win = attack them, Tie = roleblock them, Lose = no effect.';
      default:
        return 'Select your target for tonight.';
    }
  };

  return (
    <div className="night-action-panel">
      <div className="action-header">
        <span className="action-icon">{role.emoji}</span>
        <h3>{role.role} - Dusk Action</h3>
      </div>

      <div className="action-instructions">
        <p>{getInstruction()}</p>
      </div>

      <div className="target-selection">
        <label htmlFor="dusk-target-select">
          <strong>Choose Target:</strong>
        </label>
        <select
          id="dusk-target-select"
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="target-dropdown"
        >
          <option value="">-- Select a player --</option>
          {targets?.map((target) => (
            <option key={target.id} value={target.id}>
              {target.username}
            </option>
          ))}
        </select>
      </div>

      {/* Rock Paper Scissors choice for Pirate */}
      {role.actionType === 'pirate_duel' && (
        <div className="rps-selection">
          <label>
            <strong>Choose Your Move:</strong>
          </label>
          <div className="rps-buttons">
            <button
              type="button"
              className={`rps-button ${rpsChoice === 'rock' ? 'selected' : ''}`}
              onClick={() => setRpsChoice('rock')}
            >
              ✊ Rock
            </button>
            <button
              type="button"
              className={`rps-button ${rpsChoice === 'paper' ? 'selected' : ''}`}
              onClick={() => setRpsChoice('paper')}
            >
              ✋ Paper
            </button>
            <button
              type="button"
              className={`rps-button ${rpsChoice === 'scissors' ? 'selected' : ''}`}
              onClick={() => setRpsChoice('scissors')}
            >
              ✌️ Scissors
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedTarget || (role.actionType === 'pirate_duel' && !rpsChoice)}
        className="btn-action btn-primary"
      >
        {submitted ? '✓ Action Submitted - Click to Change' : 'Submit Action'}
      </button>

      {submitted && (
        <p className="action-confirmation">
          Your action has been submitted and will be processed at dusk. You can change your target before dusk ends.
        </p>
      )}

      {role.executions && (
        <p className="uses-remaining">
          Executions remaining: {role.executions}
        </p>
      )}
    </div>
  );
}

export default DuskActionPanel;
