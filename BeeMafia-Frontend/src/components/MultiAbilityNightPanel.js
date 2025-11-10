import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { getAbilityInstruction, getTargetType, canUseAbility } from '../utils/abilityHelper';
import './NightActionPanel.css';

/**
 * Enhanced Night Action Panel that supports roles with multiple abilities
 */
function MultiAbilityNightPanel({ role, targets, gameId, socket }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedTarget2, setSelectedTarget2] = useState('');
  const [submitted, setSubmitted] = useState({});
  const [activeAbility, setActiveAbility] = useState(0);

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

  // Get all abilities for this role
  const abilities = role.abilities || [{ id: role.actionType, config: role }];
  const usableAbilities = abilities.filter(ability =>
    canUseAbility(ability.id || ability, role)
  );

  if (usableAbilities.length === 0) {
    return (
      <div className="night-action-panel no-action">
        <div className="no-action-content">
          <span className="no-action-icon">❌</span>
          <h3>No Uses Remaining</h3>
          <p>You have used all charges of your abilities.</p>
        </div>
      </div>
    );
  }

  // Get current ability
  const currentAbility = usableAbilities[activeAbility];
  const abilityId = typeof currentAbility === 'string' ? currentAbility : currentAbility.id;
  const abilityConfig = typeof currentAbility === 'string' ? role : { ...role, ...currentAbility.config };

  const targetType = getTargetType(abilityId);
  const needsTwoTargets = targetType === 'double';
  const needsNoTargets = targetType === 'none';

  const handleSubmit = () => {
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

    // Mark this specific ability as submitted
    setSubmitted(prev => ({ ...prev, [abilityId]: true }));
    toast.success('Action submitted!');

    // Reset target selection
    setSelectedTarget('');
    setSelectedTarget2('');
  };

  const handleAbilitySwitch = (index) => {
    setActiveAbility(index);
    setSelectedTarget('');
    setSelectedTarget2('');
  };

  const isCurrentAbilitySubmitted = submitted[abilityId];

  return (
    <div className="night-action-panel">
      <div className="action-header">
        <span className="action-icon">{role.emoji}</span>
        <h3>{role.role} Action</h3>
      </div>

      {/* Ability Tabs - Only show if multiple abilities */}
      {usableAbilities.length > 1 && (
        <div className="ability-tabs">
          {usableAbilities.map((ability, index) => {
            const id = typeof ability === 'string' ? ability : ability.id;
            const isSubmitted = submitted[id];

            return (
              <button
                key={id}
                onClick={() => handleAbilitySwitch(index)}
                className={`ability-tab ${activeAbility === index ? 'active' : ''} ${isSubmitted ? 'submitted' : ''}`}
                disabled={isSubmitted}
              >
                {id.replace(/_/g, ' ')}
                {isSubmitted && ' ✓'}
              </button>
            );
          })}
        </div>
      )}

      <div className="action-instructions">
        <p>{getAbilityInstruction({ id: abilityId }, abilityConfig)}</p>
      </div>

      {needsNoTargets ? (
        <div className="self-action">
          <button
            onClick={handleSubmit}
            disabled={isCurrentAbilitySubmitted}
            className="btn-action btn-primary"
          >
            {isCurrentAbilitySubmitted ? '✓ Action Submitted' : `Use Ability`}
          </button>
          {(abilityConfig.vests || abilityConfig.alerts) && (
            <p className="uses-remaining">
              {abilityConfig.vests && `${abilityConfig.vests} uses remaining`}
              {abilityConfig.alerts && `${abilityConfig.alerts} uses remaining`}
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
              disabled={isCurrentAbilitySubmitted}
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
                disabled={isCurrentAbilitySubmitted}
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
            disabled={isCurrentAbilitySubmitted || !selectedTarget}
            className="btn-action btn-primary"
          >
            {isCurrentAbilitySubmitted ? '✓ Action Submitted' : 'Submit Action'}
          </button>

          {isCurrentAbilitySubmitted && (
            <p className="action-confirmation">
              Your action has been submitted and will be processed at the end of the night.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default MultiAbilityNightPanel;
