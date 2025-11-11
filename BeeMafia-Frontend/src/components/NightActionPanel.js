import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { getAbilityInstruction, getTargetType, canUseAbility } from '../utils/abilityHelper';
import './NightActionPanel.css';

function NightActionPanel({ role, targets, gameId, socket }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedTarget2, setSelectedTarget2] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Check if player is jailed (roleblocked)
  if (role.isJailed) {
    return (
      <div className="night-action-panel no-action">
        <div className="no-action-content">
          <span className="no-action-icon">⛓️</span>
          <h3>ROLEBLOCKED</h3>
          <p>You have been jailed! Your action has been blocked for tonight.</p>
        </div>
      </div>
    );
  }

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

  // Get primary ability configuration (using modular system)
  const abilityId = role.actionType;
  const abilityConfig = role;

  // Check if ability can be used (has charges remaining)
  if (!canUseAbility(abilityId, abilityConfig)) {
    return (
      <div className="night-action-panel no-action">
        <div className="no-action-content">
          <span className="no-action-icon">❌</span>
          <h3>No Uses Remaining</h3>
          <p>You have used all charges of your ability.</p>
        </div>
      </div>
    );
  }

  // Determine target requirements dynamically
  const targetType = getTargetType(abilityId);
  const needsTwoTargets = targetType === 'double';
  const needsNoTargets = targetType === 'none';

  const handleSubmit = () => {
    // Validate based on target type
    if (targetType === 'single' && !selectedTarget) {
      toast.error('Please select a target');
      return;
    }

    if (targetType === 'double' && (!selectedTarget || !selectedTarget2)) {
      toast.error('Please select two targets');
      return;
    }

    socket.emit('night_action', {
      action: abilityId,
      target: selectedTarget,
      target2: selectedTarget2
    });

    toast.success(submitted ? 'Action changed!' : 'Action submitted!');
    setSubmitted(true);
  };

  return (
    <div className="night-action-panel">
      <div className="action-header">
        <span className="action-icon">{role.emoji}</span>
        <h3>{role.role} Action</h3>
      </div>

      <div className="action-instructions">
        <p>{getAbilityInstruction({ id: abilityId }, abilityConfig)}</p>
      </div>

      {needsNoTargets ? (
        <div className="self-action">
          {/* Special handling for execute ability */}
          {abilityId === 'execute' && (
            <>
              {role.jailedPlayer ? (
                <div className="jailed-player-info">
                  <p className="jailed-label">Your Prisoner:</p>
                  <p className="jailed-name">{role.jailedPlayerName || 'Unknown'}</p>
                </div>
              ) : (
                <p className="no-prisoner">You have no prisoner to execute.</p>
              )}
            </>
          )}

          <button
            onClick={handleSubmit}
            className="btn-action btn-primary"
            disabled={abilityId === 'execute' && !role.jailedPlayer}
          >
            {submitted ? '✓ Action Submitted' : (abilityId === 'execute' ? 'Execute Prisoner' : 'Use Ability')}
          </button>
          {(role.vests || role.alerts || role.executions) && (
            <p className="uses-remaining">
              {role.vests && `${role.vests} uses remaining`}
              {role.alerts && `${role.alerts} uses remaining`}
              {role.executions !== undefined && `${role.executions} executions remaining`}
            </p>
          )}
          {submitted && (
            <p className="action-confirmation">Your action has been submitted (you can change it)</p>
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
            disabled={!selectedTarget}
            className="btn-action btn-primary"
          >
            {submitted ? '✓ Action Submitted - Click to Change' : 'Submit Action'}
          </button>

          {submitted && (
            <p className="action-confirmation">Your action has been submitted and will be processed at the end of the night. You can change your target before the night ends.</p>
          )}
        </>
      )}
    </div>
  );
}

export default NightActionPanel;
