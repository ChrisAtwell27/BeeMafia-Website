import React, { useState, useEffect } from 'react';
import './RoleConfigTab.css';

function RoleConfigTab({ gameState, socket, gameId }) {
  const [roleList, setRoleList] = useState([]);
  const [availableRoles, setAvailableRoles] = useState({});
  const [randomRolePools, setRandomRolePools] = useState({});
  const [selectedTeam, setSelectedTeam] = useState('bee');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = adding, number = replacing

  const playerCount = gameState.players?.length || 0;
  const isHost = gameState.isHost;

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_role_config', { gameId });

    socket.on('role_config_updated', (data) => {
      setRoleList(data.roles);
      setAvailableRoles(data.availableRoles);
      setRandomRolePools(data.randomRolePools || {});
    });

    return () => {
      socket.off('role_config_updated');
    };
  }, [socket, gameId]);

  // Auto-adjust roles when player count changes
  useEffect(() => {
    if (!socket || !isHost) return;

    const roleCount = roleList.length;
    if (roleCount < playerCount) {
      const needed = playerCount - roleCount;
      socket.emit('auto_add_roles', { gameId, count: needed });
    }
  }, [playerCount, roleList.length, socket, gameId, isHost]);

  const handleSelectRole = (roleKey) => {
    if (!isHost) return;

    if (editingIndex !== null) {
      // Replacing an existing role
      socket.emit('replace_role_in_config', { gameId, index: editingIndex, roleKey });
    } else {
      // Adding a new role
      socket.emit('add_role_to_config', { gameId, roleKey });
    }

    setShowRolePicker(false);
    setSearchTerm('');
    setEditingIndex(null);
  };

  const handleEditRole = (index) => {
    if (!isHost) return;
    setEditingIndex(index);

    // Pre-select the team of the role being edited
    const roleKey = roleList[index];
    const role = availableRoles?.ROLES?.[roleKey];
    if (role) {
      setSelectedTeam(role.team);
    }

    setShowRolePicker(true);
  };

  const handleRemoveRole = (index) => {
    if (!isHost) return;
    socket.emit('remove_role_from_config', { gameId, index });
  };

  const handleAddRole = () => {
    if (!isHost) return;
    setEditingIndex(null);
    setShowRolePicker(true);
  };

  const handleQuickFill = () => {
    if (!isHost) return;
    const needed = Math.max(0, playerCount - roleList.length);
    if (needed > 0) {
      socket.emit('auto_add_roles', { gameId, count: needed });
    }
  };

  // Get roles organized by team
  const getRolesByTeam = (team) => {
    if (!availableRoles || !availableRoles.ROLES) return [];

    return Object.entries(availableRoles.ROLES)
      .filter(([key, role]) => role.team === team)
      .map(([key, role]) => ({ key, ...role }))
      .filter(role =>
        searchTerm === '' ||
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get random role pools by team
  const getRandomRolesByTeam = (team) => {
    if (!randomRolePools || Object.keys(randomRolePools).length === 0) return [];

    return Object.entries(randomRolePools)
      .filter(([key, pool]) => pool.team === team)
      .map(([key, pool]) => ({ key, ...pool }))
      .filter(pool =>
        searchTerm === '' ||
        pool.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Organize current roles by team
  const getRolesGroupedByTeam = () => {
    const groups = { bee: [], wasp: [], neutral: [] };

    roleList.forEach((roleKey, index) => {
      // Check if it's a regular role
      const role = availableRoles?.ROLES?.[roleKey];
      if (role) {
        groups[role.team].push({ roleKey, role, index, isRandom: false });
        return;
      }

      // Check if it's a random role pool
      const randomPool = randomRolePools?.[roleKey];
      if (randomPool) {
        groups[randomPool.team].push({ roleKey, role: randomPool, index, isRandom: true });
      }
    });

    return groups;
  };

  // Count roles by team
  const getRoleDistribution = () => {
    const distribution = { bee: 0, wasp: 0, neutral: 0 };

    roleList.forEach(roleKey => {
      // Check regular roles
      const role = availableRoles?.ROLES?.[roleKey];
      if (role) {
        distribution[role.team] = (distribution[role.team] || 0) + 1;
        return;
      }

      // Check random role pools
      const randomPool = randomRolePools?.[roleKey];
      if (randomPool) {
        distribution[randomPool.team] = (distribution[randomPool.team] || 0) + 1;
      }
    });

    return distribution;
  };

  const distribution = getRoleDistribution();
  const roleDeficit = playerCount - roleList.length;
  const roleExcess = roleList.length - playerCount;
  const groupedRoles = getRolesGroupedByTeam();

  return (
    <div className="role-config-tab">
      {/* Status Bar */}
      <div className="role-status-bar">
        <div className="status-section">
          <div className="status-label">Players</div>
          <div className="status-value">{playerCount}</div>
        </div>
        <div className="status-divider"></div>
        <div className="status-section">
          <div className="status-label">Roles</div>
          <div className="status-value" style={{
            color: roleDeficit > 0 ? '#fbbf24' : roleExcess > 0 ? '#f87171' : '#10b981'
          }}>
            {roleList.length}
          </div>
        </div>
        <div className="status-divider"></div>
        <div className="status-section team-bee">
          <div className="status-label">🐝 Bees</div>
          <div className="status-value">{distribution.bee}</div>
        </div>
        <div className="status-section team-wasp">
          <div className="status-label">🦟 Wasps</div>
          <div className="status-value">{distribution.wasp}</div>
        </div>
        <div className="status-section team-neutral">
          <div className="status-label">⚖️ Neutrals</div>
          <div className="status-value">{distribution.neutral}</div>
        </div>
      </div>

      {/* Validation Messages */}
      {!isHost && (
        <div className="info-message">
          👀 Only the host can configure roles
        </div>
      )}

      {isHost && roleDeficit > 0 && (
        <div className="warning-message">
          ⚠️ Need {roleDeficit} more role{roleDeficit !== 1 ? 's' : ''}
          <button onClick={handleQuickFill} className="btn-quick-fill">
            Quick Fill
          </button>
        </div>
      )}

      {isHost && roleExcess > 0 && (
        <div className="error-message">
          ⚠️ Too many roles! Remove {roleExcess} role{roleExcess !== 1 ? 's' : ''}
        </div>
      )}

      {/* Add Role Button */}
      {isHost && (
        <div className="add-role-button-container">
          <button onClick={handleAddRole} className="btn-add-role-main">
            + Add Role
          </button>
        </div>
      )}

      {/* Current Roles Organized by Team */}
      <div className="roles-by-team">
        {roleList.length === 0 ? (
          <div className="empty-state">
            <p>No roles configured yet</p>
            {isHost && <button onClick={handleQuickFill} className="btn-get-started">Get Started</button>}
          </div>
        ) : (
          <>
            {/* Bee Roles */}
            {groupedRoles.bee.length > 0 && (
              <div className="team-section">
                <div className="team-section-header bee">
                  <span className="team-icon">🐝</span>
                  <h3>Bee Roles</h3>
                  <span className="team-count">({groupedRoles.bee.length})</span>
                </div>
                <div className="roles-grid">
                  {groupedRoles.bee.map(({ roleKey, role, index, isRandom }) => (
                    <div key={index} className={`role-card bee ${isRandom ? 'random-role' : ''}`} onClick={() => isHost && handleEditRole(index)}>
                      <div className="role-card-content">
                        <span className="role-emoji">{role.emoji}</span>
                        <div className="role-details">
                          <div className="role-name">{role.name}</div>
                          <div className="role-team-badge">
                            {isRandom ? '🎲 random bee' : 'bee'}
                          </div>
                        </div>
                      </div>
                      {isHost && (
                        <div className="role-card-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRole(index);
                            }}
                            className="btn-remove-role"
                            title="Remove role"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wasp Roles */}
            {groupedRoles.wasp.length > 0 && (
              <div className="team-section">
                <div className="team-section-header wasp">
                  <span className="team-icon">🦟</span>
                  <h3>Wasp Roles</h3>
                  <span className="team-count">({groupedRoles.wasp.length})</span>
                </div>
                <div className="roles-grid">
                  {groupedRoles.wasp.map(({ roleKey, role, index, isRandom }) => (
                    <div key={index} className={`role-card wasp ${isRandom ? 'random-role' : ''}`} onClick={() => isHost && handleEditRole(index)}>
                      <div className="role-card-content">
                        <span className="role-emoji">{role.emoji}</span>
                        <div className="role-details">
                          <div className="role-name">{role.name}</div>
                          <div className="role-team-badge">
                            {isRandom ? '🎲 random wasp' : 'wasp'}
                          </div>
                        </div>
                      </div>
                      {isHost && (
                        <div className="role-card-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRole(index);
                            }}
                            className="btn-remove-role"
                            title="Remove role"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neutral Roles */}
            {groupedRoles.neutral.length > 0 && (
              <div className="team-section">
                <div className="team-section-header neutral">
                  <span className="team-icon">⚖️</span>
                  <h3>Neutral Roles</h3>
                  <span className="team-count">({groupedRoles.neutral.length})</span>
                </div>
                <div className="roles-grid">
                  {groupedRoles.neutral.map(({ roleKey, role, index, isRandom }) => (
                    <div key={index} className={`role-card neutral ${isRandom ? 'random-role' : ''}`} onClick={() => isHost && handleEditRole(index)}>
                      <div className="role-card-content">
                        <span className="role-emoji">{role.emoji}</span>
                        <div className="role-details">
                          <div className="role-name">{role.name}</div>
                          <div className="role-team-badge">
                            {isRandom ? '🎲 random neutral' : 'neutral'}
                          </div>
                        </div>
                      </div>
                      {isHost && (
                        <div className="role-card-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRole(index);
                            }}
                            className="btn-remove-role"
                            title="Remove role"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Role Picker Modal */}
      {showRolePicker && isHost && (
        <div className="role-picker-overlay" onClick={() => {
          setShowRolePicker(false);
          setEditingIndex(null);
        }}>
          <div className="role-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-picker-header">
              <h3>{editingIndex !== null ? 'Replace Role' : 'Add a Role'}</h3>
              <button onClick={() => {
                setShowRolePicker(false);
                setEditingIndex(null);
              }} className="btn-close">✕</button>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>

            {/* Team Tabs */}
            <div className="team-tabs">
              <button
                className={`team-tab bee ${selectedTeam === 'bee' ? 'active' : ''}`}
                onClick={() => setSelectedTeam('bee')}
              >
                🐝 Bee Roles
              </button>
              <button
                className={`team-tab wasp ${selectedTeam === 'wasp' ? 'active' : ''}`}
                onClick={() => setSelectedTeam('wasp')}
              >
                🦟 Wasp Roles
              </button>
              <button
                className={`team-tab neutral ${selectedTeam === 'neutral' ? 'active' : ''}`}
                onClick={() => setSelectedTeam('neutral')}
              >
                ⚖️ Neutral Roles
              </button>
            </div>

            {/* Role List */}
            <div className="role-picker-list">
              {/* Random Role Options - Show First */}
              {getRandomRolesByTeam(selectedTeam).length > 0 && (
                <>
                  <div className="role-picker-divider">
                    <span>🎲 Random Roles</span>
                  </div>
                  {getRandomRolesByTeam(selectedTeam).map((pool) => (
                    <div
                      key={pool.key}
                      className={`role-picker-item ${pool.team} random-role-option`}
                      onClick={() => handleSelectRole(pool.id)}
                    >
                      <span className="role-emoji">{pool.emoji}</span>
                      <div className="role-info">
                        <div className="role-name">{pool.name}</div>
                        <div className="role-description">{pool.description}</div>
                      </div>
                      <button className="btn-select">
                        {editingIndex !== null ? '↻' : '+'}
                      </button>
                    </div>
                  ))}

                  <div className="role-picker-divider">
                    <span>Specific Roles</span>
                  </div>
                </>
              )}

              {/* Regular Roles */}
              {getRolesByTeam(selectedTeam).map((role) => (
                <div
                  key={role.key}
                  className={`role-picker-item ${role.team}`}
                  onClick={() => handleSelectRole(role.key)}
                >
                  <span className="role-emoji">{role.emoji}</span>
                  <div className="role-info">
                    <div className="role-name">{role.name}</div>
                    <div className="role-description">{role.description.substring(0, 100)}...</div>
                  </div>
                  <button className="btn-select">
                    {editingIndex !== null ? '↻' : '+'}
                  </button>
                </div>
              ))}

              {getRolesByTeam(selectedTeam).length === 0 && getRandomRolesByTeam(selectedTeam).length === 0 && (
                <div className="no-results">No roles found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="help-section">
        <p className="help-text">
          💡 Click a role card to replace it. Hover to see the remove button. Roles auto-balance as players join.
        </p>
      </div>
    </div>
  );
}

export default RoleConfigTab;
