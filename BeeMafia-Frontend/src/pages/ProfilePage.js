import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ProfilePage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameHistory();
  }, []);

  const fetchGameHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/history`);
      setGameHistory(response.data.games || []);
    } catch (error) {
      console.error('Failed to fetch game history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>👤 Profile</h1>
        <button onClick={() => navigate('/lobby')} className="btn-secondary">
          Back to Lobby
        </button>
      </header>

      <div className="profile-content">
        <div className="profile-info">
          <h2>{user?.displayName || user?.username}</h2>
          <p className="username">@{user?.username}</p>
          <p className="currency">💰 {user?.currency || 0} coins</p>
        </div>

        <div className="stats-section">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{user?.stats?.gamesPlayed || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Games Won</span>
              <span className="stat-value">{user?.stats?.gamesWon || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">
                {user?.stats?.gamesPlayed > 0
                  ? `${((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bee Wins</span>
              <span className="stat-value">{user?.stats?.beeWins || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Wasp Wins</span>
              <span className="stat-value">{user?.stats?.waspWins || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Neutral Wins</span>
              <span className="stat-value">{user?.stats?.neutralWins || 0}</span>
            </div>
          </div>
        </div>

        <div className="history-section">
          <h3>Recent Games</h3>
          {loading ? (
            <p>Loading...</p>
          ) : gameHistory.length === 0 ? (
            <p>No games played yet</p>
          ) : (
            <div className="games-history">
              {gameHistory.slice(0, 10).map((game) => (
                <div key={game._id} className="history-item">
                  <div className="history-info">
                    <p className="game-mode">{game.gameMode}</p>
                    <p className="game-date">{new Date(game.endedAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`game-result ${game.won ? 'won' : 'lost'}`}>
                    {game.won ? '✅ Won' : '❌ Lost'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
