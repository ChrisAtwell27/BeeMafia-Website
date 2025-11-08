/**
 * Mafia Game Presets - Platform-agnostic
 * Define preset role distributions for different game modes
 */

const { ROLES } = require('../roles');

function getRandomRoles(rolePool, count) {
    const shuffled = [...rolePool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function getBalancedRandomRoles(count, waspCount, neutralCount) {
    const beeRoles = Object.keys(ROLES).filter(key => ROLES[key].team === 'bee');
    const waspRoles = Object.keys(ROLES).filter(key => ROLES[key].team === 'wasp' && key !== 'WASP_QUEEN');
    const neutralRoles = Object.keys(ROLES).filter(key => ROLES[key].team === 'neutral');

    const roles = [];
    roles.push(...getRandomRoles(waspRoles, waspCount));
    roles.push(...getRandomRoles(neutralRoles, neutralCount));
    const beesNeeded = count - waspCount - neutralCount;
    roles.push(...getRandomRoles(beeRoles, beesNeeded));

    return roles;
}

const PRESETS = {
    basic: {
        name: 'Basic',
        description: 'Classic balanced game with standard roles',
        getRoles: (playerCount) => {
            const roles = [];
            roles.push('WASP_QUEEN', 'QUEENS_GUARD', 'NURSE_BEE', 'LOOKOUT_BEE', 'WORKER_BEE', 'BUTTERFLY');

            if (playerCount >= 7) roles.push('MEDIUM_BEE');
            if (playerCount >= 8) roles.push('KILLER_WASP');
            if (playerCount >= 9) roles.push('RETRIBUTIONIST_BEE');
            if (playerCount >= 10) {
                const specialBeeRoles = ['SCOUT_BEE', 'JAILER_BEE', 'TRACKER_BEE', 'SPY_BEE', 'VETERAN_BEE', 'PSYCHIC_BEE'];
                roles.push(...getRandomRoles(specialBeeRoles, 1));
            }
            if (playerCount >= 11) {
                const neutralRoles = ['CLOWN_BEETLE', 'BOUNTY_HUNTER', 'PIRATE_BEETLE', 'GUARDIAN_ANT'];
                roles.push(...getRandomRoles(neutralRoles, 1));
            }
            if (playerCount >= 12) {
                const specialWaspRoles = ['SPY_WASP', 'CONSORT_WASP', 'JANITOR_WASP', 'BLACKMAILER_WASP'];
                roles.push(...getRandomRoles(specialWaspRoles, 1));
            }
            if (playerCount >= 13) {
                const remaining = playerCount - roles.length;
                const waspCount = Math.floor(remaining * 0.25);
                const neutralCount = Math.floor(remaining * 0.15);
                roles.push(...getBalancedRandomRoles(remaining, waspCount, neutralCount));
            }
            return roles;
        }
    },

    chaos: {
        name: 'Chaos',
        description: 'Maximum chaos with unpredictable neutral roles',
        getRoles: (playerCount) => {
            const roles = ['WASP_QUEEN', 'KILLER_WASP', 'QUEENS_GUARD', 'NURSE_BEE'];
            const chaosRoles = ['PIRATE_BEETLE', 'GOSSIP_BEETLE', 'MATCHMAKER_BEETLE',
                                'CLOWN_BEETLE', 'SPIDER', 'AMNESIAC_BEETLE'];
            const neutralCount = Math.min(chaosRoles.length, playerCount - 4);
            roles.push(...getRandomRoles(chaosRoles, neutralCount));

            const remaining = playerCount - roles.length;
            if (remaining > 0) {
                const beeRoles = ['WORKER_BEE', 'SCOUT_BEE', 'LOOKOUT_BEE', 'TRACKER_BEE'];
                roles.push(...getRandomRoles(beeRoles, remaining));
            }
            return roles;
        }
    },

    investigative: {
        name: 'Investigative',
        description: 'Information warfare - lots of investigative roles',
        getRoles: (playerCount) => {
            const roles = ['WASP_QUEEN', 'SCOUT_BEE', 'QUEENS_GUARD', 'LOOKOUT_BEE', 'TRACKER_BEE', 'SPY_BEE'];

            if (playerCount >= 7) roles.push('SPY_WASP');
            if (playerCount >= 8) roles.push('KILLER_WASP');
            if (playerCount >= 9) roles.push('PSYCHIC_BEE');
            if (playerCount >= 10) roles.push('RETRIBUTIONIST_BEE');
            if (playerCount >= 13) {
                const remaining = playerCount - roles.length;
                const waspCount = Math.floor(remaining * 0.3);
                const neutralCount = Math.floor(remaining * 0.1);
                roles.push(...getBalancedRandomRoles(remaining, waspCount, neutralCount));
            }
            return roles;
        }
    },

    killing: {
        name: 'Killing',
        description: 'Blood bath mode - lots of killing roles',
        getRoles: (playerCount) => {
            const roles = ['WASP_QUEEN', 'KILLER_WASP', 'SOLDIER_BEE', 'VETERAN_BEE', 'MURDER_HORNET', 'JAILER_BEE'];

            if (playerCount >= 7) roles.push('GUARD_BEE');
            if (playerCount >= 8) roles.push('POISONER_WASP');
            if (playerCount >= 9) roles.push('FIRE_ANT');
            if (playerCount >= 10) roles.push('SOLDIER_BEE');
            if (playerCount >= 11) roles.push('CONSORT_WASP');
            if (playerCount >= 12) roles.push('NURSE_BEE');
            if (playerCount >= 13) {
                const remaining = playerCount - roles.length;
                const killingRoles = ['SOLDIER_BEE', 'VETERAN_BEE', 'JAILER_BEE', 'KILLER_WASP', 'POISONER_WASP'];
                roles.push(...getRandomRoles(killingRoles, remaining));
            }
            return roles;
        }
    }
};

function getPresetDistribution(presetName, playerCount) {
    const preset = PRESETS[presetName.toLowerCase()];
    if (!preset) {
        return null;
    }
    return preset.getRoles(playerCount);
}

function getAvailablePresets() {
    return Object.keys(PRESETS);
}

function getPresetDescription(presetName) {
    const preset = PRESETS[presetName.toLowerCase()];
    return preset ? preset.description : null;
}

module.exports = {
    getPresetDistribution,
    getAvailablePresets,
    getPresetDescription,
    PRESETS
};
