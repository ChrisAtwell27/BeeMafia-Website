/**
 * Role Categories for Random Selection
 * Based on the modular ability system
 */

const { ROLES } = require('../roles');
const { ABILITIES, ABILITY_CATEGORY } = require('./abilities');

/**
 * Get the primary ability category for a role
 */
function getRolePrimaryCategory(roleKey) {
  const role = ROLES[roleKey];
  if (!role) return null;

  // Check if role has abilities
  if (!role.abilities || role.abilities.length === 0) {
    return 'support'; // Vanilla roles like Worker Bee
  }

  // Get first ability
  const firstAbility = role.abilities[0];
  const abilityId = typeof firstAbility === 'string' ? firstAbility : firstAbility.id;
  const ability = ABILITIES[abilityId];

  return ability ? ability.category : null;
}

/**
 * Random role selection pools
 */
const RANDOM_ROLE_POOLS = {
  // Team-based random
  RANDOM_BEE: {
    id: 'RANDOM_BEE',
    name: 'Random Bee',
    emoji: '🎲🐝',
    team: 'bee',
    description: 'A random Bee role will be selected',
    isRandom: true,
    filter: (roleKey) => ROLES[roleKey]?.team === 'bee'
  },

  RANDOM_WASP: {
    id: 'RANDOM_WASP',
    name: 'Random Wasp',
    emoji: '🎲🦟',
    team: 'wasp',
    description: 'A random Wasp role will be selected',
    isRandom: true,
    filter: (roleKey) => ROLES[roleKey]?.team === 'wasp'
  },

  RANDOM_NEUTRAL: {
    id: 'RANDOM_NEUTRAL',
    name: 'Random Neutral',
    emoji: '🎲⚖️',
    team: 'neutral',
    description: 'A random Neutral role will be selected',
    isRandom: true,
    filter: (roleKey) => ROLES[roleKey]?.team === 'neutral'
  },

  // Bee category-based random
  RANDOM_BEE_INVESTIGATE: {
    id: 'RANDOM_BEE_INVESTIGATE',
    name: 'Random Investigative Bee',
    emoji: '🔍',
    team: 'bee',
    description: 'A random investigative Bee role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'bee' && getRolePrimaryCategory(roleKey) === 'investigate';
    }
  },

  RANDOM_BEE_PROTECT: {
    id: 'RANDOM_BEE_PROTECT',
    name: 'Random Protective Bee',
    emoji: '🛡️',
    team: 'bee',
    description: 'A random protective Bee role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'bee' && getRolePrimaryCategory(roleKey) === 'protect';
    }
  },

  RANDOM_BEE_KILL: {
    id: 'RANDOM_BEE_KILL',
    name: 'Random Killing Bee',
    emoji: '⚔️',
    team: 'bee',
    description: 'A random killing Bee role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'bee' && getRolePrimaryCategory(roleKey) === 'kill';
    }
  },

  RANDOM_BEE_DISRUPT: {
    id: 'RANDOM_BEE_DISRUPT',
    name: 'Random Disruptive Bee',
    emoji: '🚫',
    team: 'bee',
    description: 'A random disruptive Bee role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'bee' && getRolePrimaryCategory(roleKey) === 'disrupt';
    }
  },

  RANDOM_BEE_SUPPORT: {
    id: 'RANDOM_BEE_SUPPORT',
    name: 'Random Support Bee',
    emoji: '🤝',
    team: 'bee',
    description: 'A random support Bee role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'bee' && getRolePrimaryCategory(roleKey) === 'support';
    }
  },

  // Wasp category-based random
  RANDOM_WASP_INVESTIGATE: {
    id: 'RANDOM_WASP_INVESTIGATE',
    name: 'Random Investigative Wasp',
    emoji: '🕵️',
    team: 'wasp',
    description: 'A random investigative Wasp role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'wasp' && getRolePrimaryCategory(roleKey) === 'investigate';
    }
  },

  RANDOM_WASP_KILL: {
    id: 'RANDOM_WASP_KILL',
    name: 'Random Killing Wasp',
    emoji: '🗡️',
    team: 'wasp',
    description: 'A random killing Wasp role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'wasp' && getRolePrimaryCategory(roleKey) === 'kill';
    }
  },

  RANDOM_WASP_DISRUPT: {
    id: 'RANDOM_WASP_DISRUPT',
    name: 'Random Disruptive Wasp',
    emoji: '💋',
    team: 'wasp',
    description: 'A random disruptive Wasp role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'wasp' && getRolePrimaryCategory(roleKey) === 'disrupt';
    }
  },

  RANDOM_WASP_DECEIVE: {
    id: 'RANDOM_WASP_DECEIVE',
    name: 'Random Deceptive Wasp',
    emoji: '🎭',
    team: 'wasp',
    description: 'A random deceptive Wasp role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'wasp' && getRolePrimaryCategory(roleKey) === 'deceive';
    }
  },

  // Neutral subteam-based random
  RANDOM_NEUTRAL_KILLING: {
    id: 'RANDOM_NEUTRAL_KILLING',
    name: 'Random Neutral Killing',
    emoji: '💀',
    team: 'neutral',
    description: 'A random Neutral Killing role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'neutral' && role?.subteam === 'killing';
    }
  },

  RANDOM_NEUTRAL_EVIL: {
    id: 'RANDOM_NEUTRAL_EVIL',
    name: 'Random Neutral Evil',
    emoji: '🎯',
    team: 'neutral',
    description: 'A random Neutral Evil role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'neutral' && role?.subteam === 'evil';
    }
  },

  RANDOM_NEUTRAL_BENIGN: {
    id: 'RANDOM_NEUTRAL_BENIGN',
    name: 'Random Neutral Benign',
    emoji: '🦋',
    team: 'neutral',
    description: 'A random Neutral Benign role will be selected',
    isRandom: true,
    filter: (roleKey) => {
      const role = ROLES[roleKey];
      return role?.team === 'neutral' && role?.subteam === 'benign';
    }
  }
};

/**
 * Resolve a random role selection to an actual role
 */
function resolveRandomRole(randomRoleId) {
  const randomPool = RANDOM_ROLE_POOLS[randomRoleId];
  if (!randomPool) return null;

  // Get all roles that match the filter
  const matchingRoles = Object.keys(ROLES).filter(randomPool.filter);

  if (matchingRoles.length === 0) {
    console.warn(`No roles found for random pool: ${randomRoleId}`);
    return null;
  }

  // Pick a random role
  const randomIndex = Math.floor(Math.random() * matchingRoles.length);
  return matchingRoles[randomIndex];
}

/**
 * Get all random role options for a specific team
 */
function getRandomRolesForTeam(team) {
  return Object.values(RANDOM_ROLE_POOLS).filter(pool => pool.team === team);
}

/**
 * Check if a role key is a random selection
 */
function isRandomRole(roleKey) {
  return roleKey in RANDOM_ROLE_POOLS;
}

module.exports = {
  RANDOM_ROLE_POOLS,
  resolveRandomRole,
  getRandomRolesForTeam,
  isRandomRole,
  getRolePrimaryCategory
};
