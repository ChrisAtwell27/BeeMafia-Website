import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './UsernameEntry.css';

function UsernameEntry() {
  const [inputUsername, setInputUsername] = useState('');
  const { username, login } = useAuth();
  const navigate = useNavigate();

  // If already has username, redirect to lobby
  useEffect(() => {
    if (username) {
      navigate('/lobby');
    }
  }, [username, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const result = login(inputUsername);

    if (result.success) {
      toast.success(`Welcome, ${inputUsername}!`);
      navigate('/lobby');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="username-entry-page">
      <div className="username-container">
        <div className="game-logo">
          <div className="logo-icon">🐝</div>
          <h1>BeeMafia</h1>
          <p className="tagline">Social Deduction Game</p>
        </div>

        <div className="username-form-container">
          <h2>Enter Your Name</h2>
          <form onSubmit={handleSubmit} className="username-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Choose a username..."
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                required
                minLength="3"
                maxLength="20"
                autoFocus
                autoComplete="off"
              />
              <p className="helper-text">3-20 characters</p>
            </div>
            <button type="submit" className="btn-play">
              Play Now
            </button>
          </form>

          <div className="game-info">
            <h3>How to Play</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="icon">🎮</span>
                <p>Create or join a game room</p>
              </div>
              <div className="info-item">
                <span className="icon">🎭</span>
                <p>Get assigned a secret role</p>
              </div>
              <div className="info-item">
                <span className="icon">🌙</span>
                <p>Use night abilities strategically</p>
              </div>
              <div className="info-item">
                <span className="icon">💬</span>
                <p>Discuss and vote during the day</p>
              </div>
              <div className="info-item">
                <span className="icon">🏆</span>
                <p>Achieve your team's win condition</p>
              </div>
              <div className="info-item">
                <span className="icon">🐝</span>
                <p>56+ unique roles to discover!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="features">
          <div className="feature">
            <strong>No Account Required</strong> - Just enter a username and play
          </div>
          <div className="feature">
            <strong>Real-time Multiplayer</strong> - Play with 6-20 players
          </div>
          <div className="feature">
            <strong>Multiple Game Modes</strong> - Basic, Chaos, Investigative, Killing
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsernameEntry;
