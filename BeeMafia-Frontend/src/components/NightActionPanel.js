import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { getAbilityInstruction, getTargetType, canUseAbility } from '../utils/abilityHelper';
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

    setSubmitted(true);
    toast.success('Action submitted!');
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
          <button onClick={handleSubmit} disabled={submitted} className="btn-action btn-primary">
            {submitted ? '✓ Action Submitted' : `Use Ability`}
          </button>
          {(role.vests || role.alerts) && (
            <p className="uses-remaining">
              {role.vests && `${role.vests} uses remaining`}
              {role.alerts && `${role.alerts} uses remaining`}
            </p>
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
