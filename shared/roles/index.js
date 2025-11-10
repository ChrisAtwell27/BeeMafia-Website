/**
 * BeeMafia Game Roles - Modular System
 * All roles use the modular ability system for easy customization
 */

const { createRole } = require('../game/roleBuilder');

const ROLES = {
  // === BEE ROLES (Town equivalent) ===

  QUEENS_GUARD: createRole(
    {
      name: "Queen's Guard",
      emoji: '👮',
      team: 'bee',
      description: 'You are the **Queen\'s Guard**! You can investigate one player each night to see if they are suspicious (Wasp/Neutral Evil).',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['investigate_suspicious']
  ),

  SCOUT_BEE: createRole(
    {
      name: 'Scout Bee',
      emoji: '🔍',
      team: 'bee',
      description: 'You are a **Scout Bee**! You can investigate one player each night to learn their exact role.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['investigate_exact']
  ),

  NURSE_BEE: createRole(
    {
      name: 'Nurse Bee',
      emoji: '⚕️',
      team: 'bee',
      description: 'You are a **Nurse Bee**! You can heal one player each night, protecting them from basic attacks.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [
      {
        id: 'heal',
        config: {
          selfHealsLeft: 1,
          power: 1
        }
      }
    ]
  ),

  GUARD_BEE: createRole(
    {
      name: 'Bodyguard Bee',
      emoji: '🛡️',
      team: 'bee',
      description: 'You are a **Bodyguard Bee**! You can protect one player each night. If they are attacked, you will die instead fighting the attacker.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [
      {
        id: 'guard',
        config: {
          power: 2
        }
      }
    ]
  ),

  LOOKOUT_BEE: createRole(
    {
      name: 'Lookout Bee',
      emoji: '👁️',
      team: 'bee',
      description: 'You are a **Lookout Bee**! You can watch one player each night to see who visits them.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['lookout']
  ),

  TRACKER_BEE: createRole(
    {
      name: 'Tracker Bee',
      emoji: '🗺️',
      team: 'bee',
      description: 'You are a **Tracker Bee**! You can follow one player each night to see who they visit.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['track']
  ),

  SOLDIER_BEE: createRole(
    {
      name: 'Soldier Bee',
      emoji: '⚔️',
      team: 'bee',
      description: 'You are a **Soldier Bee**! You have 1 bullet. You can shoot one player at night.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [
      {
        id: 'shoot',
        config: {
          bullets: 1,
          power: 1
        }
      }
    ]
  ),

  VETERAN_BEE: createRole(
    {
      name: 'Veteran Bee',
      emoji: '🎖️',
      team: 'bee',
      description: 'You are a **Veteran Bee**! You can go on alert at night, killing anyone who visits you.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [
      {
        id: 'alert',
        config: {
          alerts: 3,
          power: 2
        }
      }
    ]
  ),

  JAILER_BEE: createRole(
    {
      name: 'Jailer Bee',
      emoji: '⛓️',
      team: 'bee',
      description: 'You are a **Jailer Bee**! You can jail one player each night, protecting them but preventing their actions. You can execute your jailed target.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [
      {
        id: 'jail',
        config: {
          executions: 3
        }
      }
    ]
  ),

  ESCORT_BEE: createRole(
    {
      name: 'Escort Bee',
      emoji: '💃',
      team: 'bee',
      description: 'You are an **Escort Bee**! You can distract one player each night, preventing them from performing their action.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['roleblock']
  ),

  TRAPPER_BEE: createRole(
    {
      name: 'Trapper Bee',
      emoji: '🪤',
      team: 'bee',
      description: 'You are a **Trapper Bee**! You can set a trap at one player\'s house. If an attacker visits, they are roleblocked and revealed to you.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['trap']
  ),

  SPY_BEE: createRole(
    {
      name: 'Spy Bee',
      emoji: '🕵️',
      team: 'bee',
      description: 'You are a **Spy Bee**! You can see who the Wasps visit each night and read all their communications.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['spy']
  ),

  TRANSPORTER_BEE: createRole(
    {
      name: 'Transporter Bee',
      emoji: '🔄',
      team: 'bee',
      description: 'You are a **Transporter Bee**! You can swap two players each night, redirecting all actions targeting them.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['transport']
  ),

  PSYCHIC_BEE: createRole(
    {
      name: 'Psychic Bee',
      emoji: '🔮',
      team: 'bee',
      description: 'You are a **Psychic Bee**! You receive visions showing you suspects each night.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    ['psychic']
  ),

  RETRIBUTIONIST_BEE: createRole(
    {
      name: 'Retributionist Bee',
      emoji: '⚰️',
      team: 'bee',
      description: 'You are a **Retributionist Bee**! Once per game, you can revive a dead Bee to use their ability for one night.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [
      {
        id: 'retribution',
        config: {
          hasRevived: false
        }
      }
    ]
  ),

  MEDIUM_BEE: createRole(
    {
      name: 'Medium Bee',
      emoji: '👻',
      team: 'bee',
      description: 'You are a **Medium Bee**! You can speak with ALL dead players at night and they can speak back.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [] // No night action - passive ability
  ),

  QUEEN_BEE: createRole(
    {
      name: 'Queen Bee',
      emoji: '👑',
      team: 'bee',
      description: 'You are the **Queen Bee**! You can reveal yourself during the day to gain 3 extra votes.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    [] // Day ability only
  ),

  WORKER_BEE: createRole(
    {
      name: 'Worker Bee',
      emoji: '🐝',
      team: 'bee',
      description: 'You are a **Worker Bee**! You have no special abilities, but you can help identify threats through discussion and voting.',
      winCondition: 'Eliminate all Wasps and harmful Neutrals'
    },
    []
  ),

  // === WASP ROLES (Mafia equivalent) ===

  WASP_QUEEN: createRole(
    {
      name: 'Wasp Queen',
      emoji: '👸',
      team: 'wasp',
      description: 'You are the **Wasp Queen**! You are the leader of the Wasps. You choose who to kill each night and cannot be detected by Queen\'s Guard.',
      winCondition: 'Equal or outnumber all other players'
    },
    [
      {
        id: 'mafia_kill',
        config: {
          power: 1
        }
      }
    ]
  ),

  KILLER_WASP: createRole(
    {
      name: 'Killer Wasp',
      emoji: '🗡️',
      team: 'wasp',
      description: 'You are a **Killer Wasp**! You carry out the kills for the Wasp team.',
      winCondition: 'Equal or outnumber all other players'
    },
    [
      {
        id: 'mafia_kill',
        config: {
          power: 1
        }
      }
    ]
  ),

  SPY_WASP: createRole(
    {
      name: 'Spy Wasp',
      emoji: '🕵️',
      team: 'wasp',
      description: 'You are a **Spy Wasp**! You can investigate one player each night to learn their exact role.',
      winCondition: 'Equal or outnumber all other players'
    },
    ['consigliere']
  ),

  CONSORT_WASP: createRole(
    {
      name: 'Consort Wasp',
      emoji: '💋',
      team: 'wasp',
      description: 'You are a **Consort Wasp**! You can distract one player each night, preventing them from performing their action.',
      winCondition: 'Equal or outnumber all other players'
    },
    ['roleblock']
  ),

  JANITOR_WASP: createRole(
    {
      name: 'Janitor Wasp',
      emoji: '🧹',
      team: 'wasp',
      description: 'You are a **Janitor Wasp**! You can clean up a dead body, hiding their role and last will.',
      winCondition: 'Equal or outnumber all other players'
    },
    [
      {
        id: 'clean',
        config: {
          cleans: 3
        }
      }
    ]
  ),

  DISGUISER_WASP: createRole(
    {
      name: 'Disguiser Wasp',
      emoji: '🎪',
      team: 'wasp',
      description: 'You are a **Disguiser Wasp**! You can disguise as someone who died, making you appear as their role to investigators.',
      winCondition: 'Equal or outnumber all other players'
    },
    [
      {
        id: 'disguise',
        config: {
          disguises: 3
        }
      }
    ]
  ),

  BLACKMAILER_WASP: createRole(
    {
      name: 'Blackmailer Wasp',
      emoji: '🤐',
      team: 'wasp',
      description: 'You are a **Blackmailer Wasp**! You can blackmail one player each night, silencing them for the next day.',
      winCondition: 'Equal or outnumber all other players'
    },
    ['blackmail']
  ),

  DECEIVER_WASP: createRole(
    {
      name: 'Deceiver Wasp',
      emoji: '🎭',
      team: 'wasp',
      description: 'You are a **Deceiver Wasp**! You can deceive one player each night, twisting their words during the next day phase.',
      winCondition: 'Equal or outnumber all other players'
    },
    ['deceive']
  ),

  HYPNOTIST_WASP: createRole(
    {
      name: 'Hypnotist Wasp',
      emoji: '🌀',
      team: 'wasp',
      description: 'You are a **Hypnotist Wasp**! You can hypnotize one player each night, giving them false information.',
      winCondition: 'Equal or outnumber all other players'
    },
    ['hypnotize']
  ),

  POISONER_WASP: createRole(
    {
      name: 'Poisoner Wasp',
      emoji: '🧪',
      team: 'wasp',
      description: 'You are a **Poisoner Wasp**! You can poison one player, who will die in 2 nights.',
      winCondition: 'Equal or outnumber all other players'
    },
    [
      {
        id: 'poison',
        config: {
          delay: 2,
          power: 1
        }
      }
    ]
  ),

  // === NEUTRAL ROLES ===

  // Neutral Killing
  MURDER_HORNET: createRole(
    {
      name: 'Murder Hornet',
      emoji: '💀',
      team: 'neutral',
      subteam: 'killing',
      description: 'You are a **Murder Hornet**! You must kill everyone to win.',
      winCondition: 'Be the last one standing'
    },
    [
      {
        id: 'serial_kill',
        config: {
          power: 2
        }
      }
    ]
  ),

  FIRE_ANT: createRole(
    {
      name: 'Fire Ant',
      emoji: '🔥',
      team: 'neutral',
      subteam: 'killing',
      description: 'You are a **Fire Ant**! You can douse players with gasoline and ignite them all at once.',
      winCondition: 'Be the last one standing'
    },
    [
      {
        id: 'arsonist',
        config: {
          power: 3
        }
      }
    ]
  ),

  // Neutral Evil
  CLOWN_BEETLE: createRole(
    {
      name: 'Clown Beetle',
      emoji: '🤡',
      team: 'neutral',
      subteam: 'evil',
      description: 'You are a **Clown Beetle** (Jester)! Your goal is to get yourself voted out.',
      winCondition: 'Get yourself lynched during the day'
    },
    []
  ),

  BOUNTY_HUNTER: createRole(
    {
      name: 'Bounty Hunter',
      emoji: '🎯',
      team: 'neutral',
      subteam: 'evil',
      description: 'You are a **Bounty Hunter** (Executioner)! You have a target that you must get lynched.',
      winCondition: 'Get your target lynched during the day'
    },
    []
  ),

  SPIDER: createRole(
    {
      name: 'Spider',
      emoji: '🕷️',
      team: 'neutral',
      subteam: 'evil',
      description: 'You are a **Spider** (Witch)! You can control players and make them target who you choose.',
      winCondition: 'Live to see Bees or Wasps lose'
    },
    ['witch']
  ),

  // Neutral Benign
  BUTTERFLY: createRole(
    {
      name: 'Butterfly',
      emoji: '🦋',
      team: 'neutral',
      subteam: 'benign',
      description: 'You are a **Butterfly** (Survivor)! You just want to survive.',
      winCondition: 'Survive until the end'
    },
    [
      {
        id: 'vest',
        config: {
          vests: 4,
          power: 2
        }
      }
    ]
  ),

  AMNESIAC_BEETLE: createRole(
    {
      name: 'Amnesiac Beetle',
      emoji: '🪲',
      team: 'neutral',
      subteam: 'benign',
      description: 'You are an **Amnesiac Beetle**! You can remember a dead player\'s role and join their team.',
      winCondition: 'Remember a role and achieve that role\'s win condition'
    },
    [
      {
        id: 'remember',
        config: {
          hasRemembered: false
        }
      }
    ]
  ),

  GUARDIAN_ANT: createRole(
    {
      name: 'Guardian Ant',
      emoji: '🐜',
      team: 'neutral',
      subteam: 'benign',
      description: 'You are a **Guardian Ant**! You are assigned to protect one player.',
      winCondition: 'Your target survives and wins'
    },
    ['guardian']
  ),

  PIRATE_BEETLE: createRole(
    {
      name: 'Pirate Beetle',
      emoji: '🏴‍☠️',
      team: 'neutral',
      subteam: 'killing',
      description: 'You are a **Pirate Beetle**! Challenge players to duels and win 2 times.',
      winCondition: 'Win 2 duels'
    },
    [
      {
        id: 'pirate_duel',
        config: {
          duelsWon: 0
        }
      }
    ]
  ),

  MATCHMAKER_BEETLE: createRole(
    {
      name: 'Matchmaker Beetle',
      emoji: '💕',
      team: 'neutral',
      subteam: 'benign',
      description: 'You are a **Matchmaker Beetle**! You are secretly linked with another player.',
      winCondition: 'Your linked partner wins'
    },
    []
  ),

  GOSSIP_BEETLE: createRole(
    {
      name: 'Gossip Beetle',
      emoji: '🗣️',
      team: 'neutral',
      subteam: 'benign',
      description: 'You are a **Gossip Beetle**! You can send anonymous messages.',
      winCondition: 'Survive until the end'
    },
    []
  ),

  MERCENARY: createRole(
    {
      name: 'Mercenary',
      emoji: '💰',
      team: 'neutral',
      subteam: 'benign',
      description: 'You are a **Mercenary**! You have been hired by either the Bees or Wasps (50/50 chance).',
      winCondition: 'Your assigned team wins'
    },
    []
  )
};

module.exports = { ROLES };
