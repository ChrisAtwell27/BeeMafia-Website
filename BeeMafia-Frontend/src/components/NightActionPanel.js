import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './NightActionPanel.css';

function NightActionPanel({ role, targets, gameId, socket }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedTarget2, setSelectedTarget2] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!role.nightAction) {
    return (
      <div className="night-action-panel no-action">
        <div className="no-action-content">
          <span className="no-action-icon">😴</span>
          <h3>No Night Action</h3>
          <p>You have no ability to use at night. Wait for the night phase to end.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selectedTarget && role.actionType !== 'vest' && role.actionType !== 'alert') {
      toast.error('Please select a target');
      return;
    }

    socket.emit('night_action', {
      action: role.actionType,
      target: selectedTarget,
      target2: selectedTarget2
    });

    setSubmitted(true);
    toast.success('Action submitted!');
  };

  const needsTwoTargets = role.actionType === 'transport';

  const getActionInstructions = () => {
    switch (role.actionType) {
      case 'investigate_suspicious':
        return 'Select a player to investigate and learn if they are suspicious';
      case 'investigate_exact':
        return 'Select a player to investigate and learn their exact role';
      case 'consigliere':
        return 'Select a player to learn their exact role';
      case 'heal':
        return 'Select a player to protect from basic attacks tonight';
      case 'guard':
        return 'Select a player to guard. You will die protecting them if attacked';
      case 'lookout':
        return 'Select a player to watch and see who visits them';
      case 'track':
        return 'Select a player to follow and see who they visit';
      case 'shoot':
        return `Select a player to shoot (${role.bullets || 0} bullets remaining)`;
      case 'mafia_kill':
        return 'Select a player for the Wasps to attack tonight';
      case 'serial_kill':
        return 'Select a player to kill tonight';
      case 'roleblock':
        return 'Select a player to roleblock and prevent their action';
      case 'vest':
        return `Use your bulletproof vest for powerful protection tonight (${role.vests || 0} uses remaining)`;
      case 'alert':
        return `Go on alert and kill all visitors with a powerful attack (${role.alerts || 0} uses remaining)`;
      case 'jail':
        return `Select a player to jail. They will be protected but roleblocked (${role.executions || 0} executions remaining)`;
      case 'pollinate':
        return 'Select a player to pollinate. You will see all their visits in 2 nights';
      case 'spy':
        return 'You will see all Wasp visits tonight';
      case 'trap':
        return 'Select a player to trap. Attackers will be roleblocked and revealed';
      case 'librarian':
        return 'Select a player to check if they have limited-use abilities';
      case 'psychic':
        return 'You will receive a vision of 3 players, at least one is Evil';
      case 'beekeeper':
        return 'You will learn how many Wasps are alive';
      case 'transport':
        return 'Select two players to transport. All actions targeting them are swapped';
      case 'poison':
        return 'Select a player to poison. They will die in 2 nights unless healed';
      case 'clean':
        return `Select a dead body to clean and hide their role (${role.cleans || 0} uses remaining)`;
      case 'disguise':
        return `Select a dead player to disguise as (${role.disguises || 0} uses remaining)`;
      case 'blackmail':
        return 'Select a player to blackmail and silence tomorrow';
      case 'deceive':
        return 'Select a player to deceive. Their messages will be twisted tomorrow';
      case 'hypnotize':
        return 'Select a player to hypnotize and give false feedback';
      case 'sabotage':
        return 'Select a player to sabotage. Their action fails silently';
      case 'mimic':
        return `Select a Bee role to mimic for investigations (${role.mimics || 0} uses remaining)`;
      case 'silencer':
        return `Select a player to silence their ability results (${role.silences || 0} uses remaining)`;
      default:
        return 'Select your target for tonight';
    }
  };

  return (
    <div className="night-action-panel">
      <div className="action-header">
        <span className="action-icon">{role.emoji}</span>
        <h3>{role.role} Action</h3>
      </div>

      <div className="action-instructions">
        <p>{getActionInstructions()}</p>
      </div>

      {role.actionType === 'vest' || role.actionType === 'alert' ? (
        <div className="self-action">
          <button onClick={handleSubmit} disabled={submitted} className="btn-action btn-primary">
            {submitted ? '✓ Action Submitted' : `Use ${role.actionType === 'vest' ? 'Vest' : 'Alert'}`}
          </button>
          {role.vests && (
            <p className="uses-remaining">{role.vests} uses remaining</p>
          )}
        </div>
      ) : (
        <>
          <div className="target-selection">
            <label htmlFor="target-select">
              <strong>Choose Target:</strong>
            </label>
            <select
              id="target-select"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              disabled={submitted}
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

          {needsTwoTargets && (
            <div className="target-selection">
              <label htmlFor="target2-select">
                <strong>Choose Second Target:</strong>
              </label>
              <select
                id="target2-select"
                value={selectedTarget2}
                onChange={(e) => setSelectedTarget2(e.target.value)}
                disabled={submitted}
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
          )}

          <button
            onClick={handleSubmit}
            disabled={submitted || !selectedTarget}
            className="btn-action btn-primary"
          >
            {submitted ? '✓ Action Submitted' : 'Submit Action'}
          </button>

          {submitted && (
            <p className="action-confirmation">Your action has been submitted and will be processed at the end of the night.</p>
          )}
        </>
      )}
    </div>
  );
}

export default NightActionPanel;
