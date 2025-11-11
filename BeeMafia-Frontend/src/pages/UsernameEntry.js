import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './UsernameEntry.css';

function UsernameEntry() {
  const [inputUsername, setInputUsername] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const { username, login, loginWithPassword, signup } = useAuth();
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

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await loginWithPassword(loginData.username, loginData.password);

    if (result.success) {
      toast.success(`Welcome back, ${loginData.username}!`);
      setShowLoginModal(false);
      navigate('/lobby');
    } else {
      toast.error(result.error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const result = await signup(signupData.username, signupData.email, signupData.password);

    if (result.success) {
      toast.success(`Account created! Welcome, ${signupData.username}!`);
      setShowSignupModal(false);
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

        {/* Discord Section */}
        <div className="discord-section">
          <div className="discord-card">
            <div className="discord-icon">
              <svg width="48" height="48" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
              </svg>
            </div>
            <h3>Join Our Discord Community!</h3>
            <p>To have <strong>voice chat integration</strong>, join our Discord server and play with others in real-time voice channels.</p>
            <a
              href="https://discord.gg/mTvFpxNe58"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-discord"
            >
              <span>Join Discord Server</span>
              <span className="discord-arrow">→</span>
            </a>
          </div>
        </div>

        <div className="auth-options">
          <p className="auth-divider">Want to create custom roles?</p>
          <div className="auth-buttons">
            <button onClick={() => setShowLoginModal(true)} className="btn-secondary">
              Login
            </button>
            <button onClick={() => setShowSignupModal(true)} className="btn-primary">
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>×</button>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Login</button>
            </form>
            <p className="switch-auth">
              Don't have an account? <button onClick={() => { setShowLoginModal(false); setShowSignupModal(true); }}>Sign Up</button>
            </p>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="modal-overlay" onClick={() => setShowSignupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSignupModal(false)}>×</button>
            <h2>Create Account</h2>
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  required
                  minLength="3"
                  maxLength="20"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Create Account</button>
            </form>
            <p className="switch-auth">
              Already have an account? <button onClick={() => { setShowSignupModal(false); setShowLoginModal(true); }}>Login</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsernameEntry;
