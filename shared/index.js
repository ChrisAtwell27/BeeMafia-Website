/**
 * BeeMafia Shared Package
 * Exports all shared modules for use in frontend and backend
 */

// Export roles
const { ROLES, ROLE_SETUPS, getRoleSetup } = require('./roles');

// Export game utilities
const gameUtils = require('./game/gameUtils');
const gameState = require('./game/gameState');

module.exports = {
  // Roles
  ROLES,
  ROLE_SETUPS,
  getRoleSetup,

  // Game utilities
  ...gameUtils,
  ...gameState
};
