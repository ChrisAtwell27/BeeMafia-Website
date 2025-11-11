import React from 'react';
import './JailNotificationModal.css';

function JailNotificationModal({ jailerName, onClose }) {
  return (
    <div className="jail-modal-overlay">
      <div className="jail-modal-content">
        <div className="jail-modal-header">
          <h2>⛓️ You Have Been Jailed!</h2>
        </div>

        <div className="jail-modal-body">
          <p className="jail-text">
            <strong>{jailerName}</strong> has jailed you for the night!
          </p>
          <p className="jail-info">
            You are <strong>protected</strong> from attacks but your night action has been <strong>roleblocked</strong>.
          </p>
          <p className="jail-warning">
            The Jailer may choose to execute you during the night.
          </p>
        </div>

        <div className="jail-modal-footer">
          <button
            className="btn-jail-acknowledge"
            onClick={onClose}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}

export default JailNotificationModal;
