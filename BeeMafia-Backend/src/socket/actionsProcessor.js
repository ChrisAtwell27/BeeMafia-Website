/**
 * Actions Processor
 * Processes night actions and determines outcomes
 */

const { ROLES } = require('../../../shared/roles');
const { getPlayerTeam } = require('../../../shared/game/gameUtils');
const { addVisit } = require('../../../shared/game/gameState');

/**
 * Helper function to safely add an event to a player
 */
function addPlayerEvent(playerEvents, playerId, event) {
    if (!playerEvents.has(playerId)) {
        playerEvents.set(playerId, []);
    }
    playerEvents.get(playerId).push(event);
}

function processNightActions(game) {
    const results = [];
    const attacks = new Map(); // targetId -> [{attackerId, attack}]
    const protections = new Map(); // targetId -> defense level
    const healers = new Map(); // targetId -> healerId
    const investigators = new Map(); // investigatorId -> results
    const roleblocks = new Set(); // playerIds that are roleblocked
    const playerEvents = new Map(); // playerId -> [{type, message}] - track all events for each player

    // Step 1: Process visits
    Object.entries(game.nightActions).forEach(([playerId, action]) => {
        if (action.target) {
            addVisit(game, playerId, action.target);
        }
        if (action.target2) {
            addVisit(game, playerId, action.target2);
        }
    });

    // Step 2: Process zombee infection votes
    const infections = [];
    if (game.zombeeVotes && Object.keys(game.zombeeVotes).length > 0) {
        // Tally votes
        const voteCounts = {};
        Object.values(game.zombeeVotes).forEach(targetId => {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });

        // Find most voted target
        let maxVotes = 0;
        let infectionTarget = null;
        Object.entries(voteCounts).forEach(([targetId, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                infectionTarget = targetId;
            }
        });

        if (infectionTarget) {
            // Randomly select a zombee to perform the infection
            const zombeeIds = Object.keys(game.zombeeVotes);
            const randomZombeeId = zombeeIds[Math.floor(Math.random() * zombeeIds.length)];

            infections.push({
                zombeeId: randomZombeeId,
                targetId: infectionTarget
            });

            console.log(`🧟 Zombees voted to infect ${game.players.find(p => p.id === infectionTarget)?.username}, ${game.players.find(p => p.id === randomZombeeId)?.username} will perform the infection`);
        }
    }

    // Step 3: Process roleblocks
    Object.entries(game.nightActions).forEach(([playerId, action]) => {
        if (action.action === 'roleblock' && action.target) {
            roleblocks.add(action.target);
            console.log(`🚫 ${game.players.find(p => p.id === playerId)?.username} roleblocked ${game.players.find(p => p.id === action.target)?.username}`);

            // Track roleblock event for target
            addPlayerEvent(playerEvents, action.target, { type: 'roleblocked' });
        }
    });

    // Step 3: Process protections and heals (affected by roleblock, except jail)
    Object.entries(game.nightActions).forEach(([playerId, action]) => {
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        // Jail is special - it can't be roleblocked (jailor still jails even if roleblocked)
        // But heal, guard, vest CAN be roleblocked
        if (action.action !== 'jail' && roleblocks.has(playerId)) return;

        if (action.action === 'heal' && action.target) {
            healers.set(action.target, playerId);
            protections.set(action.target, 1); // Basic protection from heal

            // Cure poison if target is poisoned
            if (!game.poisonedPlayers) game.poisonedPlayers = new Map();
            if (game.poisonedPlayers.has(action.target)) {
                game.poisonedPlayers.delete(action.target);
                // Track poison cured event
                addPlayerEvent(playerEvents, action.target, { type: 'cured' });
            }
        }

        if (action.action === 'guard' && action.target) {
            protections.set(action.target, 2); // Powerful protection from bodyguard
            // Track protection event
            addPlayerEvent(playerEvents, action.target, { type: 'protected' });
        }

        if (action.action === 'vest') {
            protections.set(playerId, 2); // Powerful protection from vest
            if (player.vests > 0) player.vests--;
            // Track self-protection event
            addPlayerEvent(playerEvents, playerId, { type: 'protected' });
        }

        if (action.action === 'jail' && action.target) {
            roleblocks.add(action.target);
            protections.set(action.target, 3); // Invincible in jail
            // Track jail event
            addPlayerEvent(playerEvents, action.target, { type: 'jailed' });
        }
    });

    // Step 4: Process attacks (affected by roleblock)
    Object.entries(game.nightActions).forEach(([playerId, action]) => {
        if (roleblocks.has(playerId)) return; // Roleblocked

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        const roleInfo = ROLES[player.role];
        if (!roleInfo) return; // Safety check

        const target = action.target;

        // Handle kill action (Wasps)
        if (action.action === 'kill' && target) {
            if (!attacks.has(target)) attacks.set(target, []);
            const attackPower = roleInfo.powerfulAttack ? 2 : 1; // Wasp Queen has powerful attack
            attacks.get(target).push({ attackerId: playerId, attack: attackPower });
        }

        // Legacy support
        if (action.action === 'mafia_kill' && target) {
            if (!attacks.has(target)) attacks.set(target, []);
            attacks.get(target).push({ attackerId: playerId, attack: 1 });
        }

        if (action.action === 'shoot' && target) {
            if (player.bullets > 0) {
                if (!attacks.has(target)) attacks.set(target, []);
                attacks.get(target).push({ attackerId: playerId, attack: roleInfo.attack || 1 });
                player.bullets--;
            }
        }

        if (action.action === 'serial_kill' && target) {
            if (!attacks.has(target)) attacks.set(target, []);
            attacks.get(target).push({ attackerId: playerId, attack: 2 });
        }

        if (action.action === 'alert') {
            // Veteran kills all visitors
            const visitors = game.visits[playerId] || [];
            visitors.forEach(visitorId => {
                if (!attacks.has(visitorId)) attacks.set(visitorId, []);
                attacks.get(visitorId).push({ attackerId: playerId, attack: 2 });
            });
            if (player.alerts > 0) player.alerts--;
        }

        // Poison - delayed 2-night death
        if (action.action === 'poison' && target) {
            if (!game.poisonedPlayers) game.poisonedPlayers = new Map();

            // Store poison with current night number
            game.poisonedPlayers.set(target, {
                poisonerId: playerId,
                poisonNight: game.currentNight || 1
            });

            // Track poison event
            addPlayerEvent(playerEvents, target, { type: 'poisoned' });
        }

        // Werewolf - only on full moon nights
        if (action.action === 'werewolf' && target && game.isFullMoon) {
            // Attack the target with powerful attack
            if (!attacks.has(target)) attacks.set(target, []);
            attacks.get(target).push({ attackerId: playerId, attack: 2 });

            // Kill all visitors to the target
            const targetVisitors = game.visits[target] || [];
            targetVisitors.forEach(visitorId => {
                if (visitorId !== playerId) { // Don't double-attack self
                    if (!attacks.has(visitorId)) attacks.set(visitorId, []);
                    attacks.get(visitorId).push({ attackerId: playerId, attack: 2 });
                }
            });

            // Kill all visitors to the Werebee
            const werebeeVisitors = game.visits[playerId] || [];
            werebeeVisitors.forEach(visitorId => {
                if (!attacks.has(visitorId)) attacks.set(visitorId, []);
                attacks.get(visitorId).push({ attackerId: playerId, attack: 2 });
            });
        }
    });

    // Step 5: Resolve attacks vs defenses (using Discord bot's attack/defense system)
    const deaths = [];
    attacks.forEach((attackList, targetId) => {
        const target = game.players.find(p => p.id === targetId);
        if (!target || !target.alive) return;

        const targetRole = ROLES[target.role];
        if (!targetRole) return;

        // Calculate highest attack level
        const maxAttack = Math.max(...attackList.map(a => a.attack));

        // Calculate defense: protection overrides base defense, or use base defense
        const baseDefense = targetRole.defense || 0;
        const protectionDefense = protections.get(targetId) || 0;
        const totalDefense = Math.max(baseDefense, protectionDefense);

        // Attack succeeds if attack > defense
        if (maxAttack > totalDefense) {
            target.alive = false;

            // Determine killer information
            const mainAttacker = attackList.find(a => a.attack === maxAttack);
            const attackerPlayer = mainAttacker ? game.players.find(p => p.id === mainAttacker.attackerId) : null;
            let killedBy = 'unknown';
            let killedByTeam = 'unknown';

            if (attackerPlayer) {
                const attackerRole = ROLES[attackerPlayer.role];
                killedBy = attackerRole ? attackerRole.name : attackerPlayer.role;
                killedByTeam = attackerRole ? attackerRole.team : 'unknown';
            }

            deaths.push({
                playerId: targetId,
                username: target.username,
                reason: 'killed',
                killedBy: killedBy,
                killedByTeam: killedByTeam
            });

            // Track death event
            addPlayerEvent(playerEvents, targetId, { type: 'killed', reason: 'killed', killedBy: killedBy });

            // Check if Soldier killed a Bee (guilt mechanic)
            attackList.forEach(attacker => {
                const attackerPlayer = game.players.find(p => p.id === attacker.attackerId);
                if (attackerPlayer && attackerPlayer.role === 'SOLDIER_BEE') {
                    const targetTeam = getPlayerTeam(target);
                    if (targetTeam === 'bee') {
                        attackerPlayer.alive = false;
                        deaths.push({
                            playerId: attackerPlayer.id,
                            username: attackerPlayer.username,
                            reason: 'guilt'
                        });
                    }
                }
            });

            // Bodyguard counter-kill (if bodyguard was protecting and target died)
            if (healers.has(targetId)) {
                const bodyguardId = healers.get(targetId);
                const bodyguard = game.players.find(p => p.id === bodyguardId);
                const bodyguardRole = bodyguard ? ROLES[bodyguard.role] : null;

                if (bodyguard && bodyguardRole && bodyguardRole.actionType === 'guard') {
                    bodyguard.alive = false;
                    deaths.push({
                        playerId: bodyguardId,
                        username: bodyguard.username,
                        reason: 'died protecting'
                    });

                    // Bodyguard kills one attacker with powerful attack (attack level 2)
                    if (attackList.length > 0) {
                        const killedAttacker = game.players.find(p => p.id === attackList[0].attackerId);
                        const attackerRole = killedAttacker ? ROLES[killedAttacker.role] : null;
                        const attackerDefense = attackerRole ? attackerRole.defense || 0 : 0;

                        // Bodyguard has attack 2 (powerful attack)
                        if (killedAttacker && killedAttacker.alive && bodyguardRole.attack > attackerDefense) {
                            killedAttacker.alive = false;
                            deaths.push({
                                playerId: killedAttacker.id,
                                username: killedAttacker.username,
                                reason: 'killed by bodyguard',
                                killedBy: bodyguardRole.name || 'Bodyguard',
                                killedByTeam: bodyguardRole.team || 'bee'
                            });
                        }
                    }
                }
            }
        } else {
            // Attack failed - player survived
            // Determine reason for survival
            if (healers.has(targetId)) {
                addPlayerEvent(playerEvents, targetId, { type: 'healed' });
            } else if (protectionDefense > 0 || baseDefense > 0) {
                // Was protected or has natural defense
                addPlayerEvent(playerEvents, targetId, { type: 'attacked' });
            }
        }
    });

    // Step 6: Process investigations (affected by roleblock)
    Object.entries(game.nightActions).forEach(([playerId, action]) => {
        // Check if player is roleblocked
        if (roleblocks.has(playerId)) return;

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        const playerRoleInfo = ROLES[player.role];
        if (!playerRoleInfo) return;

        // Handle investigate action (Scout Bee)
        if (action.action === 'investigate' && action.target) {
            const target = game.players.find(p => p.id === action.target);
            if (target) {
                const targetRoleInfo = ROLES[target.role];
                if (!targetRoleInfo) return;

                // Check if target appears innocent (Wasp Infiltrator has this property)
                const appearsInnocent = targetRoleInfo.appearsInnocent || false;
                const actuallyInnocent = targetRoleInfo.team === 'bee';

                const isSuspicious = !appearsInnocent && (
                    targetRoleInfo.team === 'wasp' ||
                    (targetRoleInfo.team === 'neutral' && targetRoleInfo.winCondition !== 'survive')
                );

                investigators.set(playerId, {
                    type: 'suspicious',
                    target: target.username,
                    result: isSuspicious ? 'suspicious' : 'not suspicious'
                });
            }
        }

        // Queen's Guard investigation (suspicious check)
        if (action.action === 'investigate_suspicious' && action.target) {
            const target = game.players.find(p => p.id === action.target);
            if (target) {
                const roleInfo = ROLES[target.role];
                const immuneToDetection = roleInfo.immuneToDetection || false;
                const isSuspicious = !immuneToDetection && (
                    roleInfo.team === 'wasp' ||
                    (roleInfo.team === 'neutral' && roleInfo.subteam === 'evil')
                );
                investigators.set(playerId, {
                    type: 'suspicious',
                    target: target.username,
                    result: isSuspicious ? 'suspicious' : 'not suspicious'
                });
            }
        }

        if (action.action === 'investigate_exact' && action.target) {
            const target = game.players.find(p => p.id === action.target);
            if (target) {
                const roleInfo = ROLES[target.role];
                investigators.set(playerId, {
                    type: 'exact',
                    target: target.username,
                    result: roleInfo.name
                });
            }
        }

        if (action.action === 'consigliere' && action.target) {
            const target = game.players.find(p => p.id === action.target);
            if (target) {
                const roleInfo = ROLES[target.role];
                investigators.set(playerId, {
                    type: 'exact',
                    target: target.username,
                    result: roleInfo.name
                });
            }
        }

        if (action.action === 'lookout' && action.target) {
            const visitors = game.visits[action.target] || [];
            const visitorNames = visitors
                .map(id => game.players.find(p => p.id === id))
                .filter(p => p)
                .map(p => p.username);
            investigators.set(playerId, {
                type: 'lookout',
                target: game.players.find(p => p.id === action.target)?.username,
                result: visitorNames.length > 0 ? visitorNames.join(', ') : 'no visitors'
            });
        }

        if (action.action === 'track' && action.target) {
            const targetVisits = Object.entries(game.visits)
                .filter(([_, visitors]) => visitors.includes(action.target))
                .map(([targetId]) => game.players.find(p => p.id === targetId))
                .filter(p => p)
                .map(p => p.username);
            investigators.set(playerId, {
                type: 'track',
                target: game.players.find(p => p.id === action.target)?.username,
                result: targetVisits.length > 0 ? targetVisits.join(', ') : 'stayed home'
            });
        }

        // Pollinator - delayed lookout/tracker combo (2-night delay)
        if (action.action === 'pollinate' && action.target) {
            // Initialize pollination tracking if needed
            if (!game.pollinatedPlayers) game.pollinatedPlayers = new Map();

            // Store pollination for 2-night delay
            game.pollinatedPlayers.set(action.target, {
                pollinatorId: playerId,
                night: game.currentNight || 1
            });
        }

        // Spy Bee - see Wasp visits
        if (action.action === 'spy') {
            const waspVisits = [];
            Object.entries(game.visits).forEach(([targetId, visitors]) => {
                visitors.forEach(visitorId => {
                    const visitor = game.players.find(p => p.id === visitorId);
                    if (visitor && ROLES[visitor.role]?.team === 'wasp') {
                        const target = game.players.find(p => p.id === targetId);
                        waspVisits.push(`${visitor.username} visited ${target?.username}`);
                    }
                });
            });
            investigators.set(playerId, {
                type: 'spy',
                result: waspVisits.length > 0 ? waspVisits.join(', ') : 'Wasps did not visit anyone'
            });
        }

        // Librarian - check for limited-use abilities
        if (action.action === 'librarian' && action.target) {
            const target = game.players.find(p => p.id === action.target);
            if (target) {
                const roleInfo = ROLES[target.role];
                const hasLimitedAbility = !!(
                    target.bullets || target.vests || target.cleans ||
                    target.disguises || target.mimics || target.silences ||
                    target.alerts || target.executions || roleInfo.bullets ||
                    roleInfo.vests || roleInfo.cleans || roleInfo.disguises ||
                    roleInfo.mimics || roleInfo.silences || roleInfo.alerts || roleInfo.executions
                );
                investigators.set(playerId, {
                    type: 'librarian',
                    target: target.username,
                    result: hasLimitedAbility ? 'has special powers' : 'has no special powers'
                });
            }
        }

        // Psychic - vision of 3 players, at least one is evil
        if (action.action === 'psychic') {
            const alivePlayers = game.players.filter(p => p.alive && p.id !== playerId);
            const evilPlayers = alivePlayers.filter(p => {
                const roleInfo = ROLES[p.role];
                return roleInfo.team === 'wasp' || roleInfo.subteam === 'evil' || roleInfo.subteam === 'killing';
            });

            // Pick 3 random players with at least 1 evil
            const vision = [];
            if (evilPlayers.length > 0 && alivePlayers.length >= 3) {
                // Add 1 random evil player
                const evilPick = evilPlayers[Math.floor(Math.random() * evilPlayers.length)];
                vision.push(evilPick);

                // Add 2 random others (not already picked)
                const remaining = alivePlayers.filter(p => p.id !== evilPick.id);
                while (vision.length < 3 && remaining.length > 0) {
                    const randomIndex = Math.floor(Math.random() * remaining.length);
                    vision.push(remaining[randomIndex]);
                    remaining.splice(randomIndex, 1);
                }
            }

            investigators.set(playerId, {
                type: 'psychic',
                result: vision.length > 0 ?
                    `Vision: ${vision.map(p => p.username).join(', ')} (at least one is Evil)` :
                    'No vision available'
            });
        }

        // Beekeeper - learn Wasp count
        if (action.action === 'beekeeper') {
            const waspCount = game.players.filter(p => p.alive && ROLES[p.role]?.team === 'wasp').length;
            investigators.set(playerId, {
                type: 'beekeeper',
                result: `There are ${waspCount} Wasps alive`
            });
        }
    });

    // Step 7: Process poison deaths (2-night delay)
    if (!game.poisonedPlayers) game.poisonedPlayers = new Map();
    const currentNight = game.currentNight || 1;
    const poisonDeaths = [];

    game.poisonedPlayers.forEach((poisonInfo, targetId) => {
        const nightsSincePoisoned = currentNight - poisonInfo.poisonNight;

        // Kill after 2 nights
        if (nightsSincePoisoned >= 2) {
            const target = game.players.find(p => p.id === targetId);
            if (target && target.alive) {
                target.alive = false;

                // Get poisoner information
                const poisoner = game.players.find(p => p.id === poisonInfo.poisonerId);
                let killedBy = 'poison';
                let killedByTeam = 'unknown';

                if (poisoner) {
                    const poisonerRole = ROLES[poisoner.role];
                    killedBy = poisonerRole ? poisonerRole.name : poisoner.role;
                    killedByTeam = poisonerRole ? poisonerRole.team : 'unknown';
                }

                poisonDeaths.push({
                    playerId: targetId,
                    username: target.username,
                    reason: 'poisoned',
                    killedBy: killedBy,
                    killedByTeam: killedByTeam
                });
                game.poisonedPlayers.delete(targetId);
            }
        }
    });

    deaths.push(...poisonDeaths);

    // Step 8: Process zombee infections
    const conversions = [];
    infections.forEach(infection => {
        const target = game.players.find(p => p.id === infection.targetId);
        if (!target || !target.alive) return;

        const targetRole = ROLES[target.role];
        if (!targetRole) return;

        // Check if target already a zombee
        if (targetRole.team === 'zombee') {
            console.log(`🧟 Cannot infect ${target.username} - already a zombee`);
            return;
        }

        // Get target's defense (base defense or protection)
        const baseDefense = targetRole.defense || 0;
        const protectionDefense = protections.get(infection.targetId) || 0;
        const totalDefense = Math.max(baseDefense, protectionDefense);

        // Infection succeeds if defense is 0 or 1 (basic or less)
        if (totalDefense <= 1) {
            // Convert player to zombee
            const oldRole = target.role;
            target.role = 'ZOMBEE';

            conversions.push({
                playerId: infection.targetId,
                username: target.username,
                oldRole: oldRole,
                newRole: 'ZOMBEE'
            });

            // Track infection event
            addPlayerEvent(playerEvents, infection.targetId, {
                type: 'infected',
                message: 'You have been infected and turned into a Zombee!'
            });

            console.log(`🧟 ${target.username} was infected and converted to Zombee (defense: ${totalDefense})`);
        } else {
            // Target had strong defense (2+) and resisted infection
            addPlayerEvent(playerEvents, infection.targetId, {
                type: 'infection_resisted',
                message: 'You resisted a zombee infection!'
            });

            console.log(`🧟 ${target.username} resisted infection (defense: ${totalDefense})`);
        }
    });

    // Compile results
    results.push(...deaths);

    return {
        deaths,
        investigations: investigators,
        roleblocks: Array.from(roleblocks),
        playerEvents: playerEvents, // Map of playerId -> [{type, message}]
        conversions: conversions // Zombee conversions
    };
}

module.exports = { processNightActions };
