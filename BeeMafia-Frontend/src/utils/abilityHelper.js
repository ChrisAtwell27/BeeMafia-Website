/**
 * Frontend Ability Helper
 * Works with the modular ability system from the backend
 */

/**
 * Get instruction text for an ability
 */
export function getAbilityInstruction(ability, config = {}) {
  if (!ability) return 'Select your target for tonight';

  // Use the ability's instruction template
  switch (ability.id) {
    case 'investigate_suspicious':
      return 'Select a player to investigate and learn if they are suspicious';

    case 'investigate_exact':
      return 'Select a player to investigate and learn their exact role';

    case 'heal':
      const selfHeals = config.selfHealsLeft > 0 ? ` (${config.selfHealsLeft} self-heals left)` : '';
      return `Select a player to protect from basic attacks tonight${selfHeals}`;

    case 'guard':
      return 'Select a player to guard. You will die protecting them if attacked';

    case 'lookout':
      return 'Select a player to watch and see who visits them';

    case 'track':
      return 'Select a player to follow and see who they visit';

    case 'shoot':
      return `Select a player to shoot (${config.bullets || 0} bullets remaining)`;

    case 'mafia_kill':
      return 'Select a player for the Wasps to attack tonight';

    case 'serial_kill':
      return 'Select a player to kill tonight';

    case 'roleblock':
      return 'Select a player to roleblock and prevent their action';

    case 'vest':
      return `Use your bulletproof vest for powerful protection tonight (${config.vests || 0} uses remaining)`;

    case 'alert':
      return `Go on alert and kill all visitors with a powerful attack (${config.alerts || 0} uses remaining)`;

    case 'jail':
      return `Select a player to jail. They will be protected but roleblocked (${config.executions || 0} executions remaining)`;

    case 'spy':
      return 'You will see all Wasp visits tonight';

    case 'trap':
      return 'Select a player to trap. Attackers will be roleblocked and revealed';

    case 'transport':
      return 'Select two players to transport. All actions targeting them are swapped';

    case 'poison':
      const delay = config.delay || 2;
      return `Select a player to poison. They will die in ${delay} nights unless healed`;

    case 'clean':
      return `Select a dead body to clean and hide their role (${config.cleans || 0} uses remaining)`;

    case 'disguise':
      return `Select a dead player to disguise as (${config.disguises || 0} uses remaining)`;

    case 'blackmail':
      return 'Select a player to blackmail and silence tomorrow';

    case 'deceive':
      return 'Select a player to deceive. Their messages will be twisted tomorrow';

    case 'hypnotize':
      return 'Select a player to hypnotize and give false feedback';

    case 'psychic':
      return 'You will receive a vision of 3 players, at least one is Evil';

    case 'pollinate':
      const pollinateDelay = config.delay || 2;
      return `Select a player to pollinate. You will see all their visits in ${pollinateDelay} nights`;

    case 'librarian':
      return 'Select a player to check if they have limited-use abilities';

    case 'beekeeper':
      return 'You will learn how many Wasps are alive';

    case 'mimic':
      return `Select a Bee role to mimic for investigations (${config.mimics || 0} uses remaining)`;

    case 'silencer':
      return `Select a player to silence their ability results (${config.silences || 0} uses remaining)`;

    case 'sabotage':
      return 'Select a player to sabotage. Their action fails silently';

    case 'consigliere':
      return 'Select a player to learn their exact role';

    case 'arsonist':
      return config.canIgnite ? 'Ignite all doused players' : 'Select a player to douse with gasoline';

    case 'witch':
      return 'Select a player to control and who they should target';

    case 'remember':
      return 'Select a dead player to remember their role';

    case 'retribution':
      return 'Select a dead Bee to revive for one night';

    case 'pirate_duel':
      return `Challenge a player to a duel (${config.duelsWon || 0}/2 wins)`;

    case 'guardian':
      return 'Select a player to guard (usually your assigned target)';

    default:
      return 'Select your target for tonight';
  }
}

/**
 * Determine if ability needs targets
 */
export function getTargetType(abilityId) {
  const noTargetAbilities = ['vest', 'alert', 'spy', 'psychic', 'beekeeper'];
  const doubleTargetAbilities = ['transport', 'witch'];
  const deadTargetAbilities = ['clean', 'disguise', 'remember', 'retribution'];

  if (noTargetAbilities.includes(abilityId)) {
    return 'none';
  }
  if (doubleTargetAbilities.includes(abilityId)) {
    return 'double';
  }
  if (deadTargetAbilities.includes(abilityId)) {
    return 'dead';
  }
  return 'single';
}

/**
 * Check if ability can still be used (has charges)
 */
export function canUseAbility(abilityId, config) {
  // Check various charge types
  if (config.uses !== undefined && config.uses !== null) {
    return config.uses > 0;
  }
  if (config.bullets !== undefined) {
    return config.bullets > 0;
  }
  if (config.vests !== undefined) {
    return config.vests > 0;
  }
  if (config.alerts !== undefined) {
    return config.alerts > 0;
  }
  if (config.cleans !== undefined) {
    return config.cleans > 0;
  }
  if (config.disguises !== undefined) {
    return config.disguises > 0;
  }
  if (config.mimics !== undefined) {
    return config.mimics > 0;
  }
  if (config.silences !== undefined) {
    return config.silences > 0;
  }
  if (config.executions !== undefined) {
    return config.executions > 0;
  }

  // Check one-time use abilities
  if (config.hasRemembered !== undefined) {
    return !config.hasRemembered;
  }
  if (config.hasRevived !== undefined) {
    return !config.hasRevived;
  }

  // If unlimited or no charges, can always use
  return true;
}
