import React, { useState } from 'react';
import './PersonalMorningPopup.css';

function PersonalMorningPopup({ investigations, onClose }) {
  if (!investigations || investigations.length === 0) return null;

  return (
    <div className="personal-morning-popup">
      <div className="personal-morning-card">
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        <div className="personal-morning-header">
          <span className="personal-icon">📋</span>
          <h2 className="personal-title">Your Findings</h2>
        </div>

        <div className="personal-morning-content">
          <div className="findings-list">
            {investigations.map((investigation, index) => (
              <div key={index} className="finding-entry">
                <span className="finding-icon">{investigation.icon}</span>
                <span className="finding-message">{investigation.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalMorningPopup;
