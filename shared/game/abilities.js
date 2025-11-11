/**
 * Modular Ability System
 * Each ability is self-contained with configuration and behavior
 */

// Ability Target Types
const TARGET_TYPE = {
  NONE: 'none',           // No target needed (self-abilities)
  SINGLE: 'single',       // Select one player
  DOUBLE: 'double',       // Select two players
  SELF: 'self',           // Only target yourself
  DEAD: 'dead'            // Target dead players only
};

// Ability Categories
const ABILITY_CATEGORY = {
  INVESTIGATE: 'investigate',
  PROTECT: 'protect',
  KILL: 'kill',
  DISRUPT: 'disrupt',
  SUPPORT: 'support',
  DECEIVE: 'deceive'
};

/**
 * Ability Definitions
 * Each ability is a module that can be attached to any role
 */
const ABILITIES = {
  // === INVESTIGATIVE ABILITIES ===
  investigate_suspicious: {
    id: 'investigate_suspicious',
    name: 'Investigate (Suspicious)',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'Learn if a player appears suspicious or not suspicious',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🔍',
    config: {
      unlimited: { type: 'boolean', default: true, description: 'Unlimited uses' },
      uses: { type: 'number', default: null, min: 0, max: 99, description: 'Limited uses (null = unlimited)' }
    },
    getInstruction: (config) => 'Select a player to investigate and learn if they are suspicious',
    priority: 20
  },

  investigate_exact: {
    id: 'investigate_exact',
    name: 'Investigate (Exact Role)',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'Learn the exact role of a player',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🔎',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to investigate and learn their exact role',
    priority: 20
  },

  lookout: {
    id: 'lookout',
    name: 'Lookout',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'See who visits your target',
    targetType: TARGET_TYPE.SINGLE,
    icon: '👁️',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to watch and see who visits them',
    priority: 80
  },

  track: {
    id: 'track',
    name: 'Track',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'See who your target visits',
    targetType: TARGET_TYPE.SINGLE,
    icon: '👣',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to follow and see who they visit',
    priority: 80
  },

  spy: {
    id: 'spy',
    name: 'Spy',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'See all Wasp visits',
    targetType: TARGET_TYPE.NONE,
    icon: '🕵️',
    config: {
      unlimited: { type: 'boolean', default: true }
    },
    getInstruction: (config) => 'You will see all Wasp visits tonight',
    priority: 90
  },

  psychic: {
    id: 'psychic',
    name: 'Psychic Vision',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'Receive a vision of 3 players, at least one is Evil',
    targetType: TARGET_TYPE.NONE,
    icon: '🔮',
    config: {
      unlimited: { type: 'boolean', default: true }
    },
    getInstruction: (config) => 'You will receive a vision of 3 players, at least one is Evil',
    priority: 85
  },

  beekeeper: {
    id: 'beekeeper',
    name: 'Wasp Count',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'Learn how many Wasps are alive',
    targetType: TARGET_TYPE.NONE,
    icon: '🐝',
    config: {
      unlimited: { type: 'boolean', default: true }
    },
    getInstruction: (config) => 'You will learn how many Wasps are alive',
    priority: 85
  },

  librarian: {
    id: 'librarian',
    name: 'Check Limited Abilities',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'Check if a player has limited-use abilities',
    targetType: TARGET_TYPE.SINGLE,
    icon: '📚',
    config: {
      unlimited: { type: 'boolean', default: true }
    },
    getInstruction: (config) => 'Select a player to check if they have limited-use abilities',
    priority: 75
  },

  pollinate: {
    id: 'pollinate',
    name: 'Pollinate',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'See all visits on a player in 2 nights',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🌸',
    config: {
      unlimited: { type: 'boolean', default: true },
      delay: { type: 'number', default: 2, min: 1, max: 5, description: 'Nights until result' }
    },
    getInstruction: (config) => `Select a player to pollinate. You will see all their visits in ${config.delay || 2} nights`,
    priority: 75
  },

  // === PROTECTIVE ABILITIES ===
  heal: {
    id: 'heal',
    name: 'Heal',
    category: ABILITY_CATEGORY.PROTECT,
    description: 'Protect a player from basic attacks',
    targetType: TARGET_TYPE.SINGLE,
    icon: '💚',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 },
      selfHeal: { type: 'boolean', default: true, description: 'Can heal self once' },
      selfHealsLeft: { type: 'number', default: 1, min: 0, max: 5, description: 'Self-heal charges' },
      power: { type: 'number', default: 1, min: 1, max: 3, description: 'Protection power level' }
    },
    getInstruction: (config) => {
      const heals = config.selfHealsLeft > 0 ? ` (${config.selfHealsLeft} self-heals left)` : '';
      return `Select a player to protect from basic attacks tonight${heals}`;
    },
    priority: 30
  },

  guard: {
    id: 'guard',
    name: 'Guard',
    category: ABILITY_CATEGORY.PROTECT,
    description: 'Die protecting your target if attacked',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🛡️',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 },
      power: { type: 'number', default: 2, min: 1, max: 3, description: 'Protection power level' }
    },
    getInstruction: (config) => 'Select a player to guard. You will die protecting them if attacked',
    priority: 30
  },

  vest: {
    id: 'vest',
    name: 'Bulletproof Vest',
    category: ABILITY_CATEGORY.PROTECT,
    description: 'Powerful self-protection',
    targetType: TARGET_TYPE.SELF,
    icon: '🦺',
    config: {
      uses: { type: 'number', default: 4, min: 1, max: 10 },
      power: { type: 'number', default: 2, min: 1, max: 3, description: 'Protection power level' }
    },
    getInstruction: (config) => `Use your bulletproof vest for powerful protection tonight (${config.uses || 0} uses remaining)`,
    priority: 35
  },

  trap: {
    id: 'trap',
    name: 'Trap',
    category: ABILITY_CATEGORY.PROTECT,
    description: 'Roleblock and reveal attackers',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🪤',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to trap. Attackers will be roleblocked and revealed',
    priority: 40
  },

  // === KILLING ABILITIES ===
  mafia_kill: {
    id: 'mafia_kill',
    name: 'Wasp Attack',
    category: ABILITY_CATEGORY.KILL,
    description: 'Attack a player for the Wasp team',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🗡️',
    config: {
      unlimited: { type: 'boolean', default: true },
      power: { type: 'number', default: 1, min: 1, max: 3, description: 'Attack power level' }
    },
    getInstruction: (config) => 'Select a player for the Wasps to attack tonight',
    priority: 50
  },

  serial_kill: {
    id: 'serial_kill',
    name: 'Serial Kill',
    category: ABILITY_CATEGORY.KILL,
    description: 'Kill a player as a neutral killer',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🔪',
    config: {
      unlimited: { type: 'boolean', default: true },
      power: { type: 'number', default: 1, min: 1, max: 3, description: 'Attack power level' }
    },
    getInstruction: (config) => 'Select a player to kill tonight',
    priority: 50
  },

  shoot: {
    id: 'shoot',
    name: 'Shoot',
    category: ABILITY_CATEGORY.KILL,
    description: 'Shoot a player with limited bullets',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🔫',
    config: {
      bullets: { type: 'number', default: 3, min: 1, max: 10 },
      power: { type: 'number', default: 2, min: 1, max: 3, description: 'Attack power level' }
    },
    getInstruction: (config) => `Select a player to shoot (${config.bullets || 0} bullets remaining)`,
    priority: 55
  },

  poison: {
    id: 'poison',
    name: 'Poison',
    category: ABILITY_CATEGORY.KILL,
    description: 'Poison a player to die in X nights',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🧪',
    config: {
      unlimited: { type: 'boolean', default: true },
      delay: { type: 'number', default: 2, min: 1, max: 5, description: 'Nights until death' },
      power: { type: 'number', default: 1, min: 1, max: 3 }
    },
    getInstruction: (config) => `Select a player to poison. They will die in ${config.delay || 2} nights unless healed`,
    priority: 60
  },

  alert: {
    id: 'alert',
    name: 'Alert',
    category: ABILITY_CATEGORY.KILL,
    description: 'Kill all visitors with a powerful attack',
    targetType: TARGET_TYPE.SELF,
    icon: '⚠️',
    config: {
      alerts: { type: 'number', default: 3, min: 1, max: 10 },
      power: { type: 'number', default: 3, min: 1, max: 3, description: 'Attack power level' }
    },
    getInstruction: (config) => `Go on alert and kill all visitors with a powerful attack (${config.alerts || 0} uses remaining)`,
    priority: 45
  },

  // === DISRUPTIVE ABILITIES ===
  roleblock: {
    id: 'roleblock',
    name: 'Roleblock',
    category: ABILITY_CATEGORY.DISRUPT,
    description: 'Prevent a player from using their ability',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🚫',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to roleblock and prevent their action',
    priority: 10
  },

  jail: {
    id: 'jail',
    name: 'Jail',
    category: ABILITY_CATEGORY.DISRUPT,
    description: 'Protect and roleblock a player (Dusk action)',
    targetType: TARGET_TYPE.SINGLE,
    phase: 'dusk', // This ability is used during dusk
    icon: '⛓️',
    config: {
      unlimited: { type: 'boolean', default: true }
    },
    getInstruction: (config) => 'Select a player to jail. They will be protected but roleblocked',
    priority: 5
  },

  execute: {
    id: 'execute',
    name: 'Execute',
    category: ABILITY_CATEGORY.ATTACK,
    description: 'Execute your jailed prisoner with unstoppable attack',
    targetType: TARGET_TYPE.NONE, // No target selection - automatically executes jailed player
    phase: 'night', // This ability is used during night
    icon: '⚔️',
    config: {
      executions: { type: 'number', default: 3, min: 0, max: 10, description: 'Execution charges' }
    },
    getInstruction: (config) => `Choose to execute your jailed prisoner (${config.executions || 0} executions remaining)`,
    priority: 3 // Execute before most protections but after jail
  },

  blackmail: {
    id: 'blackmail',
    name: 'Blackmail',
    category: ABILITY_CATEGORY.DISRUPT,
    description: 'Silence a player for the next day',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🤐',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to blackmail and silence tomorrow',
    priority: 65
  },

  sabotage: {
    id: 'sabotage',
    name: 'Sabotage',
    category: ABILITY_CATEGORY.DISRUPT,
    description: 'Make a player\'s action fail silently',
    targetType: TARGET_TYPE.SINGLE,
    icon: '⚙️',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to sabotage. Their action fails silently',
    priority: 15
  },

  // === SUPPORT ABILITIES ===
  transport: {
    id: 'transport',
    name: 'Transport',
    category: ABILITY_CATEGORY.SUPPORT,
    description: 'Swap all actions between two players',
    targetType: TARGET_TYPE.DOUBLE,
    icon: '🚐',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select two players to transport. All actions targeting them are swapped',
    priority: 25
  },

  // === DECEPTION ABILITIES ===
  deceive: {
    id: 'deceive',
    name: 'Deceive',
    category: ABILITY_CATEGORY.DECEIVE,
    description: 'Twist a player\'s messages',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🎭',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to deceive. Their messages will be twisted tomorrow',
    priority: 70
  },

  hypnotize: {
    id: 'hypnotize',
    name: 'Hypnotize',
    category: ABILITY_CATEGORY.DECEIVE,
    description: 'Give false feedback to a player',
    targetType: TARGET_TYPE.SINGLE,
    icon: '😵‍💫',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to hypnotize and give false feedback',
    priority: 95
  },

  clean: {
    id: 'clean',
    name: 'Clean',
    category: ABILITY_CATEGORY.DECEIVE,
    description: 'Hide a dead player\'s role',
    targetType: TARGET_TYPE.DEAD,
    icon: '🧹',
    config: {
      cleans: { type: 'number', default: 3, min: 1, max: 10 }
    },
    getInstruction: (config) => `Select a dead body to clean and hide their role (${config.cleans || 0} uses remaining)`,
    priority: 100
  },

  disguise: {
    id: 'disguise',
    name: 'Disguise',
    category: ABILITY_CATEGORY.DECEIVE,
    description: 'Disguise as a dead player',
    targetType: TARGET_TYPE.DEAD,
    icon: '🎭',
    config: {
      disguises: { type: 'number', default: 3, min: 1, max: 10 }
    },
    getInstruction: (config) => `Select a dead player to disguise as (${config.disguises || 0} uses remaining)`,
    priority: 100
  },

  mimic: {
    id: 'mimic',
    name: 'Mimic',
    category: ABILITY_CATEGORY.DECEIVE,
    description: 'Appear as a specific role to investigators',
    targetType: TARGET_TYPE.NONE,
    icon: '🦎',
    config: {
      mimics: { type: 'number', default: 3, min: 1, max: 10 }
    },
    getInstruction: (config) => `Select a Bee role to mimic for investigations (${config.mimics || 0} uses remaining)`,
    priority: 95
  },

  silencer: {
    id: 'silencer',
    name: 'Silence Results',
    category: ABILITY_CATEGORY.DECEIVE,
    description: 'Prevent a player from receiving ability results',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🔇',
    config: {
      silences: { type: 'number', default: 3, min: 1, max: 10 }
    },
    getInstruction: (config) => `Select a player to silence their ability results (${config.silences || 0} uses remaining)`,
    priority: 92
  },

  // === SPECIAL/UNIQUE ABILITIES ===
  consigliere: {
    id: 'consigliere',
    name: 'Consigliere Investigation',
    category: ABILITY_CATEGORY.INVESTIGATE,
    description: 'Learn the exact role of a player (Wasp version)',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🕵️',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to learn their exact role',
    priority: 20
  },

  arsonist: {
    id: 'arsonist',
    name: 'Douse and Ignite',
    category: ABILITY_CATEGORY.KILL,
    description: 'Douse players with gasoline and ignite them all at once',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🔥',
    config: {
      unlimited: { type: 'boolean', default: true },
      power: { type: 'number', default: 3, min: 1, max: 3, description: 'Unstoppable when igniting' },
      canIgnite: { type: 'boolean', default: false, description: 'Can ignite this night' }
    },
    getInstruction: (config) => config.canIgnite ? 'Ignite all doused players' : 'Select a player to douse with gasoline',
    priority: 55
  },

  witch: {
    id: 'witch',
    name: 'Control',
    category: ABILITY_CATEGORY.DISRUPT,
    description: 'Control a player and make them target who you choose',
    targetType: TARGET_TYPE.DOUBLE,
    icon: '🕷️',
    config: {
      unlimited: { type: 'boolean', default: true },
      uses: { type: 'number', default: null, min: 0, max: 99 }
    },
    getInstruction: (config) => 'Select a player to control and who they should target',
    priority: 8
  },

  remember: {
    id: 'remember',
    name: 'Remember Role',
    category: ABILITY_CATEGORY.SUPPORT,
    description: 'Remember a dead player\'s role and become that role',
    targetType: TARGET_TYPE.DEAD,
    icon: '🪲',
    config: {
      hasRemembered: { type: 'boolean', default: false }
    },
    getInstruction: () => 'Select a dead player to remember their role',
    priority: 99
  },

  retribution: {
    id: 'retribution',
    name: 'Revive Dead Bee',
    category: ABILITY_CATEGORY.SUPPORT,
    description: 'Revive a dead Bee to use their ability for one night',
    targetType: TARGET_TYPE.DEAD,
    icon: '⚰️',
    config: {
      hasRevived: { type: 'boolean', default: false }
    },
    getInstruction: () => 'Select a dead Bee to revive for one night',
    priority: 98
  },

  pirate_duel: {
    id: 'pirate_duel',
    name: 'Pirate Duel',
    category: ABILITY_CATEGORY.DISRUPT,
    description: 'Challenge a player to a duel (rock-paper-scissors)',
    targetType: TARGET_TYPE.SINGLE,
    phase: 'dusk', // This ability is used during dusk
    icon: '🏴‍☠️',
    config: {
      unlimited: { type: 'boolean', default: true },
      duelsWon: { type: 'number', default: 0, min: 0, max: 10 }
    },
    getInstruction: (config) => `Challenge a player to a duel (${config.duelsWon || 0}/2 wins)`,
    priority: 12
  },

  guardian: {
    id: 'guardian',
    name: 'Guardian Protection',
    category: ABILITY_CATEGORY.PROTECT,
    description: 'Guard your assigned target',
    targetType: TARGET_TYPE.SINGLE,
    icon: '🐜',
    config: {
      unlimited: { type: 'boolean', default: true },
      power: { type: 'number', default: 2, min: 1, max: 3 }
    },
    getInstruction: () => 'Select a player to guard (usually your assigned target)',
    priority: 30
  }
};

/**
 * Helper function to get ability with merged config
 */
function getAbilityWithConfig(abilityId, customConfig = {}) {
  const ability = ABILITIES[abilityId];
  if (!ability) return null;

  // Merge default config with custom config
  const config = {};
  for (const [key, definition] of Object.entries(ability.config)) {
    config[key] = customConfig[key] !== undefined ? customConfig[key] : definition.default;
  }

  return {
    ...ability,
    config
  };
}

/**
 * Get instruction text for an ability with its config
 */
function getAbilityInstruction(abilityId, config = {}) {
  const ability = ABILITIES[abilityId];
  if (!ability) return 'Select your target for tonight';

  return ability.getInstruction(config);
}

/**
 * Check if an ability can be used (has charges remaining)
 */
function canUseAbility(abilityId, currentConfig) {
  const ability = ABILITIES[abilityId];
  if (!ability) return false;

  // Check various charge types
  if (currentConfig.uses !== undefined && currentConfig.uses !== null) {
    return currentConfig.uses > 0;
  }
  if (currentConfig.bullets !== undefined) {
    return currentConfig.bullets > 0;
  }
  if (currentConfig.vests !== undefined) {
    return currentConfig.vests > 0;
  }
  if (currentConfig.alerts !== undefined) {
    return currentConfig.alerts > 0;
  }
  if (currentConfig.cleans !== undefined) {
    return currentConfig.cleans > 0;
  }
  if (currentConfig.disguises !== undefined) {
    return currentConfig.disguises > 0;
  }
  if (currentConfig.mimics !== undefined) {
    return currentConfig.mimics > 0;
  }
  if (currentConfig.silences !== undefined) {
    return currentConfig.silences > 0;
  }
  if (currentConfig.executions !== undefined) {
    return currentConfig.executions > 0;
  }

  // Check one-time use abilities
  if (currentConfig.hasRemembered !== undefined) {
    return !currentConfig.hasRemembered;
  }
  if (currentConfig.hasRevived !== undefined) {
    return !currentConfig.hasRevived;
  }

  // If unlimited or no charges, can always use
  return true;
}

/**
 * Consume a use of an ability
 */
function consumeAbilityUse(abilityId, currentConfig) {
  const newConfig = { ...currentConfig };

  if (newConfig.uses !== undefined && newConfig.uses !== null) {
    newConfig.uses = Math.max(0, newConfig.uses - 1);
  }
  if (newConfig.bullets !== undefined) {
    newConfig.bullets = Math.max(0, newConfig.bullets - 1);
  }
  if (newConfig.vests !== undefined) {
    newConfig.vests = Math.max(0, newConfig.vests - 1);
  }
  if (newConfig.alerts !== undefined) {
    newConfig.alerts = Math.max(0, newConfig.alerts - 1);
  }
  if (newConfig.cleans !== undefined) {
    newConfig.cleans = Math.max(0, newConfig.cleans - 1);
  }
  if (newConfig.disguises !== undefined) {
    newConfig.disguises = Math.max(0, newConfig.disguises - 1);
  }
  if (newConfig.mimics !== undefined) {
    newConfig.mimics = Math.max(0, newConfig.mimics - 1);
  }
  if (newConfig.silences !== undefined) {
    newConfig.silences = Math.max(0, newConfig.silences - 1);
  }
  if (newConfig.executions !== undefined) {
    newConfig.executions = Math.max(0, newConfig.executions - 1);
  }
  if (newConfig.duelsWon !== undefined) {
    newConfig.duelsWon = Math.min(10, newConfig.duelsWon + 1);
  }

  // One-time use abilities
  if (newConfig.hasRemembered !== undefined) {
    newConfig.hasRemembered = true;
  }
  if (newConfig.hasRevived !== undefined) {
    newConfig.hasRevived = true;
  }

  return newConfig;
}

module.exports = {
  ABILITIES,
  TARGET_TYPE,
  ABILITY_CATEGORY,
  getAbilityWithConfig,
  getAbilityInstruction,
  canUseAbility,
  consumeAbilityUse
};
