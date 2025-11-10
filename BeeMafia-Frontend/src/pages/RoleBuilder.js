import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import './RoleBuilder.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Common abilities available for custom roles
const AVAILABLE_ABILITIES = [
  { id: 'investigate_suspicious', name: '🔎 Investigate (Suspicious)', description: 'Check if a player is suspicious (Wasp/Neutral Evil)' },
  { id: 'investigate_exact', name: '🔍 Investigate (Exact)', description: 'Learn a player\'s exact role' },
  { id: 'heal', name: '⚕️ Heal', description: 'Protect a player from basic attacks', config: { selfHealsLeft: 1, power: 1 } },
  { id: 'guard', name: '🛡️ Bodyguard', description: 'Die instead of target if they\'re attacked', config: { power: 2 } },
  { id: 'lookout', name: '👁️ Lookout', description: 'See who visits a player' },
  { id: 'track', name: '🗺️ Track', description: 'See who a player visits' },
  { id: 'shoot', name: '🔫 Shoot', description: 'Kill a player (limited bullets)', config: { bullets: 1, power: 1 } },
  { id: 'alert', name: '⚔️ Alert', description: 'Kill anyone who visits you', config: { alerts: 3, power: 3 } },
  { id: 'jail', name: '⛓️ Jail', description: 'Jail and optionally execute a player', config: { executions: 3 } },
  { id: 'roleblock', name: '💃 Roleblock', description: 'Prevent a player from using their ability' },
  { id: 'trap', name: '🪤 Trap', description: 'Set a trap that reveals attackers' },
  { id: 'spy', name: '🕵️ Spy', description: 'See who Wasps visit and read their chat' },
  { id: 'transport', name: '🔄 Transport', description: 'Swap two players, redirecting actions' },
  { id: 'psychic', name: '🔮 Psychic', description: 'Receive visions showing suspects' },
  { id: 'mafia_kill', name: '🗡️ Mafia Kill', description: 'Choose someone to kill (Wasp ability)', config: { power: 1 } },
  { id: 'clean', name: '🧹 Clean', description: 'Hide a dead player\'s role', config: { cleans: 3 } },
  { id: 'disguise', name: '🎪 Disguise', description: 'Appear as a dead player\'s role', config: { disguises: 3 } },
  { id: 'blackmail', name: '🤐 Blackmail', description: 'Silence a player for the next day' },
  { id: 'deceive', name: '🎭 Deceive', description: 'Twist a player\'s words' },
  { id: 'hypnotize', name: '🌀 Hypnotize', description: 'Give false information to a player' },
  { id: 'poison', name: '🧪 Poison', description: 'Poison a player (delayed death)', config: { delay: 2, power: 1 } },
  { id: 'serial_kill', name: '💀 Serial Kill', description: 'Powerful attack that ignores basic protection', config: { power: 2 } },
  { id: 'vest', name: '🦺 Vest', description: 'Protect yourself from attacks', config: { vests: 4, power: 2 } }
];

const WIN_CONDITIONS = {
  bee: 'Eliminate all Wasps and harmful Neutrals',
  wasp: 'Equal or outnumber all other players',
  neutral_killing: 'Be the last one standing',
  neutral_benign: 'Survive until the end',
  neutral_evil: 'Get yourself lynched during the day'
};

function RoleBuilder() {
  const navigate = useNavigate();
  const { isAuthenticated, authToken, username } = useAuth();
  const [customRoles, setCustomRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form state
  const [roleName, setRoleName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [team, setTeam] = useState('bee');
  const [subteam, setSubteam] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAbilities, setSelectedAbilities] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to create custom roles');
      navigate('/');
      return;
    }

    fetchCustomRoles();
  }, [isAuthenticated, navigate]);

  const fetchCustomRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/roles`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCustomRoles(response.data.customRoles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load custom roles');
    }
  };

  const handleAbilityToggle = (abilityId) => {
    if (selectedAbilities.find(a => a.id === abilityId || a === abilityId)) {
      setSelectedAbilities(selectedAbilities.filter(a =>
        (typeof a === 'string' ? a : a.id) !== abilityId
      ));
    } else {
      const ability = AVAILABLE_ABILITIES.find(a => a.id === abilityId);
      if (ability.config) {
        setSelectedAbilities([...selectedAbilities, { id: abilityId, config: { ...ability.config } }]);
      } else {
        setSelectedAbilities([...selectedAbilities, abilityId]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roleName || !emoji || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const winCondition = team === 'neutral'
      ? (subteam === 'killing' ? WIN_CONDITIONS.neutral_killing :
         subteam === 'evil' ? WIN_CONDITIONS.neutral_evil :
         WIN_CONDITIONS.neutral_benign)
      : WIN_CONDITIONS[team];

    const roleData = {
      name: roleName,
      emoji,
      team,
      subteam: team === 'neutral' ? subteam : null,
      description,
      winCondition,
      abilities: selectedAbilities
    };

    try {
      if (selectedRole) {
        await axios.put(`${API_URL}/api/roles/${selectedRole.id}`, roleData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        toast.success('Role updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/roles`, roleData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        toast.success('Role created successfully!');
      }

      // Reset form
      clearForm();
      fetchCustomRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(error.response?.data?.error || 'Failed to save role');
    }
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setEmoji(role.emoji);
    setTeam(role.team);
    setSubteam(role.subteam || '');
    setDescription(role.description);
    setSelectedAbilities(role.abilities || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      toast.success('Role deleted successfully!');
      fetchCustomRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const clearForm = () => {
    setSelectedRole(null);
    setRoleName('');
    setEmoji('');
    setTeam('bee');
    setSubteam('');
    setDescription('');
    setSelectedAbilities([]);
  };

  const isAbilitySelected = (abilityId) => {
    return selectedAbilities.some(a =>
      (typeof a === 'string' ? a : a.id) === abilityId
    );
  };

  return (
    <div className="role-builder-page">
      <header className="role-builder-header">
        <button onClick={() => navigate('/lobby')} className="btn-back">
          ← Back to Lobby
        </button>
        <h1>🎨 Custom Role Builder</h1>
        <span className="user-badge">Playing as: <strong>{username}</strong></span>
      </header>

      <div className="role-builder-content">
        {/* Form Section */}
        <div className="form-section">
          <h2>{selectedRole ? 'Edit Role' : 'Create New Role'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Super Detective"
                  required
                />
              </div>

              <div className="form-group emoji-group">
                <label>Emoji *</label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🎯"
                  maxLength="2"
                  required
                  className="emoji-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Team *</label>
                <select value={team} onChange={(e) => setTeam(e.target.value)} required>
                  <option value="bee">🐝 Bee (Town)</option>
                  <option value="wasp">🐝 Wasp (Mafia)</option>
                  <option value="neutral">🦋 Neutral</option>
                </select>
              </div>

              {team === 'neutral' && (
                <div className="form-group">
                  <label>Subteam *</label>
                  <select value={subteam} onChange={(e) => setSubteam(e.target.value)} required>
                    <option value="">Select...</option>
                    <option value="benign">Benign (Survivor)</option>
                    <option value="evil">Evil (Jester)</option>
                    <option value="killing">Killing (Serial Killer)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this role does..."
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Abilities ({selectedAbilities.length} selected)</label>
              <div className="abilities-grid">
                {AVAILABLE_ABILITIES.map(ability => (
                  <div
                    key={ability.id}
                    className={`ability-card ${isAbilitySelected(ability.id) ? 'selected' : ''}`}
                    onClick={() => handleAbilityToggle(ability.id)}
                  >
                    <div className="ability-name">{ability.name}</div>
                    <div className="ability-desc">{ability.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              {selectedRole && (
                <button type="button" onClick={clearForm} className="btn-cancel">
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="btn-submit">
                {selectedRole ? '💾 Update Role' : '✨ Create Role'}
              </button>
            </div>
          </form>
        </div>

        {/* My Roles Section */}
        <div className="my-roles-section">
          <h2>My Custom Roles ({customRoles.length}/50)</h2>
          {customRoles.length === 0 ? (
            <div className="empty-state">
              <p>You haven't created any custom roles yet.</p>
              <p>Fill out the form to create your first role!</p>
            </div>
          ) : (
            <div className="roles-list">
              {customRoles.map(role => (
                <div key={role.id} className="role-item">
                  <div className="role-header">
                    <span className="role-emoji">{role.emoji}</span>
                    <span className="role-name">{role.name}</span>
                    <span className={`role-team team-${role.team}`}>
                      {role.team === 'bee' ? '🐝' : role.team === 'wasp' ? '🐝' : '🦋'}
                    </span>
                  </div>
                  <p className="role-description">{role.description}</p>
                  <div className="role-abilities">
                    {role.abilities && role.abilities.length > 0 ? (
                      role.abilities.map((ability, idx) => {
                        const abilityId = typeof ability === 'string' ? ability : ability.id;
                        const abilityInfo = AVAILABLE_ABILITIES.find(a => a.id === abilityId);
                        return (
                          <span key={idx} className="ability-badge">
                            {abilityInfo ? abilityInfo.name : abilityId}
                          </span>
                        );
                      })
                    ) : (
                      <span className="no-abilities">No abilities</span>
                    )}
                  </div>
                  <div className="role-actions">
                    <button onClick={() => handleEdit(role)} className="btn-edit">✏️ Edit</button>
                    <button onClick={() => handleDelete(role.id)} className="btn-delete">🗑️ Delete</button>
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

export default RoleBuilder;
