/**
 * Role Builder - Helpers for creating roles with modular abilities
 */

const { ABILITIES, getAbilityWithConfig } = require('./abilities');

/**
 * Create a role with modular abilities
 *
 * @param {Object} baseInfo - Basic role information
 * @param {Array} abilities - Array of ability configurations
 * @returns {Object} Complete role object
 */
function createRole(baseInfo, abilities = []) {
  const role = {
    name: baseInfo.name,
    emoji: baseInfo.emoji,
    team: baseInfo.team,
    subteam: baseInfo.subteam || null,
    description: baseInfo.description,
    winCondition: baseInfo.winCondition,

    // Abilities array with configurations
    abilities: abilities.map(abilityConfig => {
      const abilityId = typeof abilityConfig === 'string' ? abilityConfig : abilityConfig.id;
      const config = typeof abilityConfig === 'string' ? {} : abilityConfig.config || {};

      return {
        id: abilityId,
        config: { ...ABILITIES[abilityId]?.config || {}, ...config }
      };
    }),

    // Compute properties from abilities
    nightAction: abilities.length > 0,
    attack: computeAttack(abilities),
    defense: computeDefense(abilities),

    // Legacy support - keep for now during transition
    actionType: abilities.length > 0 ? (typeof abilities[0] === 'string' ? abilities[0] : abilities[0].id) : null
  };

  // Add ability-specific properties for easy access (for backward compatibility)
  abilities.forEach(abilityConfig => {
    const abilityId = typeof abilityConfig === 'string' ? abilityConfig : abilityConfig.id;
    const config = typeof abilityConfig === 'string' ? {} : abilityConfig.config || {};
    const ability = ABILITIES[abilityId];

    if (!ability) return;

    // Add configuration values directly to role for easy access
    Object.entries(ability.config).forEach(([key, definition]) => {
      const value = config[key] !== undefined ? config[key] : definition.default;
      if (value !== undefined && value !== null) {
        role[key] = value;
      }
    });
  });

  return role;
}

/**
 * Compute attack level from abilities
 */
function computeAttack(abilities) {
  let maxAttack = 0;

  abilities.forEach(abilityConfig => {
    const abilityId = typeof abilityConfig === 'string' ? abilityConfig : abilityConfig.id;
    const config = typeof abilityConfig === 'string' ? {} : abilityConfig.config || {};
    const ability = ABILITIES[abilityId];

    if (!ability) return;

    // Check if ability has attack power configured
    if (ability.config.power) {
      const power = config.power !== undefined ? config.power : ability.config.power.default;
      if (['mafia_kill', 'serial_kill', 'shoot', 'poison', 'alert', 'guard'].includes(abilityId)) {
        maxAttack = Math.max(maxAttack, power || 0);
      }
    }
  });

  return maxAttack;
}

/**
 * Compute defense level from abilities
 */
function computeDefense(abilities) {
  let maxDefense = 0;

  abilities.forEach(abilityConfig => {
    const abilityId = typeof abilityConfig === 'string' ? abilityConfig : abilityConfig.id;
    const config = typeof abilityConfig === 'string' ? {} : abilityConfig.config || {};
    const ability = ABILITIES[abilityId];

    if (!ability) return;

    // Vest and alert provide defense
    if (abilityId === 'vest' || abilityId === 'alert') {
      const power = config.power !== undefined ? config.power : ability.config.power?.default || 0;
      maxDefense = Math.max(maxDefense, power);
    }
  });

  return maxDefense;
}

/**
 * Get all abilities for a role with their current configs
 */
function getRoleAbilities(role) {
  if (!role.abilities || role.abilities.length === 0) {
    return [];
  }

  return role.abilities.map(abilityConfig => {
    const abilityId = abilityConfig.id;
    const ability = ABILITIES[abilityId];

    if (!ability) return null;

    return {
      ...ability,
      config: abilityConfig.config
    };
  }).filter(a => a !== null);
}

/**
 * Get primary night ability for a role (for backward compatibility)
 */
function getPrimaryNightAbility(role) {
  const abilities = getRoleAbilities(role);
  return abilities.length > 0 ? abilities[0] : null;
}

module.exports = {
  createRole,
  getRoleAbilities,
  getPrimaryNightAbility,
  computeAttack,
  computeDefense
};
