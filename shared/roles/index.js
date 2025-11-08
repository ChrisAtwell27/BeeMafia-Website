/**
 * Mafia Game Roles - Platform-agnostic role definitions
 * Extracted from Discord bot for use in web application
 *
 * Role Structure:
 * - name: Display name of the role
 * - emoji: Emoji representation
 * - team: 'bee', 'wasp', or 'neutral'
 * - subteam: For neutrals - 'killing', 'evil', or 'benign'
 * - description: Full role description
 * - abilities: Array of ability descriptions
 * - winCondition: How this role wins
 * - nightAction: Boolean - has night action
 * - actionType: Type of action (for processing)
 * - attack: Attack level (0=none, 1=basic, 2=powerful, 3=unstoppable)
 * - defense: Defense level (0=none, 1=basic, 2=powerful, 3=invincible)
 */

const ROLES = {
    // === BEE ROLES (Town equivalent) ===
    QUEENS_GUARD: {
        name: "Queen's Guard",
        emoji: '👮',
        team: 'bee',
        description: 'You are the **Queen\'s Guard**! You can investigate one player each night to see if they are suspicious (Wasp/Neutral Evil).',
        abilities: ['Investigate one player each night', 'Learn if they are suspicious or not'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'investigate_suspicious',
        attack: 0,
        defense: 0
    },
    SCOUT_BEE: {
        name: 'Scout Bee',
        emoji: '🔍',
        team: 'bee',
        description: 'You are a **Scout Bee**! You can investigate one player each night to learn their exact role.',
        abilities: ['Investigate one player each night', 'Learn their exact role'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'investigate_exact',
        attack: 0,
        defense: 0
    },
    NURSE_BEE: {
        name: 'Nurse Bee',
        emoji: '⚕️',
        team: 'bee',
        description: 'You are a **Nurse Bee**! You can heal one player each night, protecting them from basic attacks.',
        abilities: ['Heal one player each night', 'Prevents them from dying to basic attacks', 'Self-heal once'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'heal',
        attack: 0,
        defense: 0,
        selfHealsLeft: 1
    },
    GUARD_BEE: {
        name: 'Bodyguard Bee',
        emoji: '🛡️',
        team: 'bee',
        description: 'You are a **Bodyguard Bee**! You can protect one player each night. If they are attacked, you will die instead fighting the attacker.',
        abilities: ['Protect one player each night', 'Die in their place if attacked', 'Kill one attacker'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'guard',
        attack: 2, // Powerful attack against attacker
        defense: 0
    },
    LOOKOUT_BEE: {
        name: 'Lookout Bee',
        emoji: '👁️',
        team: 'bee',
        description: 'You are a **Lookout Bee**! You can watch one player each night to see who visits them.',
        abilities: ['Watch one player each night', 'See everyone who visits them'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'lookout',
        attack: 0,
        defense: 0
    },
    SOLDIER_BEE: {
        name: 'Soldier Bee',
        emoji: '⚔️',
        team: 'bee',
        description: 'You are a **Soldier Bee**! You have 1 bullet. You can shoot one player at night.',
        abilities: ['Shoot one player each night (1 bullet total)', 'Basic attack', 'If you shoot a Bee, you die from guilt'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'shoot',
        attack: 1,
        defense: 0,
        bullets: 1
    },
    QUEEN_BEE: {
        name: 'Queen Bee',
        emoji: '👑',
        team: 'bee',
        description: 'You are the **Queen Bee**! You can reveal yourself during the day to gain 3 extra votes.',
        abilities: ['Reveal during day phase for 3 extra votes'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: false,
        canReveal: true,
        attack: 0,
        defense: 0
    },
    WORKER_BEE: {
        name: 'Worker Bee',
        emoji: '🐝',
        team: 'bee',
        description: 'You are a **Worker Bee**! You have no special abilities, but you can help identify threats through discussion and voting.',
        abilities: ['Vote during the day phase'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: false,
        attack: 0,
        defense: 0
    },
    JAILER_BEE: {
        name: 'Jailer Bee',
        emoji: '⛓️',
        team: 'bee',
        description: 'You are a **Jailer Bee**! You can jail one player each night, protecting them but preventing their actions. You can execute your jailed target.',
        abilities: ['Jail one player each night', 'Target cannot perform actions or be visited', 'Execute jailed target (3 executions max)', 'If you execute a Bee, you lose all executions'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        duskAction: true,
        actionType: 'jail',
        attack: 3, // Unstoppable execution
        defense: 0,
        executions: 3
    },
    ESCORT_BEE: {
        name: 'Escort Bee',
        emoji: '💃',
        team: 'bee',
        description: 'You are an **Escort Bee**! You can distract one player each night, preventing them from performing their action.',
        abilities: ['Roleblock one player each night', 'Prevent their night action', 'Cannot roleblock the same person twice in a row'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'roleblock',
        attack: 0,
        defense: 0
    },
    MEDIUM_BEE: {
        name: 'Medium Bee',
        emoji: '👻',
        team: 'bee',
        description: 'You are a **Medium Bee**! You can speak with ALL dead players at night and they can speak back.',
        abilities: ['Speak with all dead players during night phase', 'Dead players can send messages visible to you and other dead players', 'You can reply and all dead players will see your messages'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: false,
        attack: 0,
        defense: 0
    },
    VETERAN_BEE: {
        name: 'Veteran Bee',
        emoji: '🎖️',
        team: 'bee',
        description: 'You are a **Veteran Bee**! You can go on alert at night, killing anyone who visits you.',
        abilities: ['Go on alert 3 times', 'Kill all visitors with powerful attack', 'Cannot be roleblocked while on alert'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'alert',
        attack: 2,
        defense: 0,
        alerts: 3
    },
    TRACKER_BEE: {
        name: 'Tracker Bee',
        emoji: '🗺️',
        team: 'bee',
        description: 'You are a **Tracker Bee**! You can follow one player each night to see who they visit.',
        abilities: ['Follow one player each night', 'See who they visit', 'Does not see what action they perform'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'track',
        attack: 0,
        defense: 0
    },
    TRAPPER_BEE: {
        name: 'Trapper Bee',
        emoji: '🪤',
        team: 'bee',
        description: 'You are a **Trapper Bee**! You can set a trap at one player\'s house. If an attacker visits, they are roleblocked and revealed to you.',
        abilities: ['Set a trap at one player\'s house each night', 'Attackers visiting are roleblocked', 'Learn the identity of trapped attackers'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'trap',
        attack: 0,
        defense: 0
    },
    RETRIBUTIONIST_BEE: {
        name: 'Retributionist Bee',
        emoji: '⚰️',
        team: 'bee',
        description: 'You are a **Retributionist Bee**! Once per game, you can revive a dead Bee to use their ability for one night.',
        abilities: ['Revive one dead Bee once per game', 'Revived player uses their ability for one night', 'Only works on Bee team members'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'retribution',
        attack: 0,
        defense: 0,
        hasRevived: false
    },
    SPY_BEE: {
        name: 'Spy Bee',
        emoji: '🕵️',
        team: 'bee',
        description: 'You are a **Spy Bee**! You can see who the Wasps visit each night and read all their communications.',
        abilities: ['See all Wasp visits each night', 'Read all Wasp chat messages', 'Identify Wasp targets and plans'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'spy',
        attack: 0,
        defense: 0
    },
    TRANSPORTER_BEE: {
        name: 'Transporter Bee',
        emoji: '🔄',
        team: 'bee',
        description: 'You are a **Transporter Bee**! You can swap two players each night, redirecting all actions targeting them.',
        abilities: ['Choose two players each night', 'All actions targeting them are swapped', 'Visitors targeting player A go to player B and vice versa', 'Can cause chaos or save people'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: false,
        duskAction: true,
        actionType: 'transport',
        attack: 0,
        defense: 0
    },
    PSYCHIC_BEE: {
        name: 'Psychic Bee',
        emoji: '🔮',
        team: 'bee',
        description: 'You are a **Psychic Bee**! You receive visions showing you suspects each night.',
        abilities: ['Receive a vision of 3 random players each night', 'At least one is Evil (Wasp or Evil Neutral)', 'Use deduction to narrow down suspects'],
        winCondition: 'Eliminate all Wasps and harmful Neutrals',
        nightAction: true,
        actionType: 'psychic',
        attack: 0,
        defense: 0
    },

    // === WASP ROLES (Mafia equivalent) ===
    WASP_QUEEN: {
        name: 'Wasp Queen',
        emoji: '👸',
        team: 'wasp',
        description: 'You are the **Wasp Queen**! You are the leader of the Wasps. You choose who to kill each night and cannot be detected by Queen\'s Guard.',
        abilities: ['Choose kill target each night', 'Basic attack', 'Basic defense', 'Immune to detection', 'Appear as not suspicious', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'mafia_kill',
        attack: 1,
        defense: 1,
        immuneToDetection: true
    },
    KILLER_WASP: {
        name: 'Killer Wasp',
        emoji: '🗡️',
        team: 'wasp',
        description: 'You are a **Killer Wasp**! You carry out the kills for the Wasp team.',
        abilities: ['Kill target chosen by Wasps', 'Basic attack', 'Become Wasp Queen if Queen dies', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'mafia_kill',
        attack: 1,
        defense: 0
    },
    DECEIVER_WASP: {
        name: 'Deceiver Wasp',
        emoji: '🎭',
        team: 'wasp',
        description: 'You are a **Deceiver Wasp**! You can deceive one player each night, twisting their words during the next day phase to make them sound suspicious and incriminating.',
        abilities: ['Deceive one player each night', 'All their messages during the next day will be twisted to sound incriminating', 'Messages are transformed to flip meanings, change accusations, or claim evil roles', 'Target is NOT notified - they must figure it out from context', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'deceive',
        attack: 0,
        defense: 0
    },
    SPY_WASP: {
        name: 'Spy Wasp',
        emoji: '🕵️',
        team: 'wasp',
        description: 'You are a **Spy Wasp**! You can investigate one player each night to learn their exact role.',
        abilities: ['Investigate one player each night', 'Learn their exact role', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'consigliere',
        attack: 0,
        defense: 0
    },
    CONSORT_WASP: {
        name: 'Consort Wasp',
        emoji: '💋',
        team: 'wasp',
        description: 'You are a **Consort Wasp**! You can distract one player each night, preventing them from performing their action.',
        abilities: ['Roleblock one player each night', 'Prevent their night action', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'roleblock',
        attack: 0,
        defense: 0
    },
    JANITOR_WASP: {
        name: 'Janitor Wasp',
        emoji: '🧹',
        team: 'wasp',
        description: 'You are a **Janitor Wasp**! You can clean up a dead body, hiding their role and last will.',
        abilities: ['Clean one dead body (3 uses)', 'Hide their role from investigators', 'Learn the cleaned role yourself', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'clean',
        attack: 0,
        defense: 0,
        cleans: 3
    },
    DISGUISER_WASP: {
        name: 'Disguiser Wasp',
        emoji: '🎪',
        team: 'wasp',
        description: 'You are a **Disguiser Wasp**! You can disguise as someone who died, making you appear as their role to investigators.',
        abilities: ['Disguise as a dead player (3 uses)', 'Appear as their role to investigations', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'disguise',
        attack: 0,
        defense: 0,
        disguises: 3
    },
    BLACKMAILER_WASP: {
        name: 'Blackmailer Wasp',
        emoji: '🤐',
        team: 'wasp',
        description: 'You are a **Blackmailer Wasp**! You can blackmail one player each night, transforming all their messages during the next day phase to sound casual, positive, and deflecting.',
        abilities: ['Blackmail one player each night', 'Target cannot speak in voice', 'All their text messages are transformed to positive/deflecting context', 'Accusations are flipped or redirected', 'Makes them sound chill and unbothered', 'Target only knows they were muted - must figure out text transformation from context', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'blackmail',
        attack: 0,
        defense: 0
    },
    HYPNOTIST_WASP: {
        name: 'Hypnotist Wasp',
        emoji: '🌀',
        team: 'wasp',
        description: 'You are a **Hypnotist Wasp**! You can hypnotize one player each night, giving them false information about what happened.',
        abilities: ['Hypnotize one player each night', 'Give them false night results', 'Make investigators see wrong information', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'hypnotize',
        attack: 0,
        defense: 0
    },
    POISONER_WASP: {
        name: 'Poisoner Wasp',
        emoji: '🧪',
        team: 'wasp',
        description: 'You are a **Poisoner Wasp**! You can poison one player, who will die in 2 nights.',
        abilities: ['Poison one player each night', 'They die after 2 nights', 'Basic attack (delayed)', 'Communicate with Wasps'],
        winCondition: 'Equal or outnumber all other players',
        nightAction: true,
        actionType: 'poison',
        attack: 1,
        defense: 0
    },

    // === NEUTRAL ROLES ===
    // Neutral Killing
    MURDER_HORNET: {
        name: 'Murder Hornet',
        emoji: '💀',
        team: 'neutral',
        subteam: 'killing',
        description: 'You are a **Murder Hornet**! You must kill everyone to win.',
        abilities: ['Kill one player each night', 'Powerful attack', 'Basic defense', 'Counter-kill visitors every other night'],
        winCondition: 'Be the last one standing',
        nightAction: true,
        actionType: 'serial_kill',
        attack: 2,
        defense: 1
    },
    FIRE_ANT: {
        name: 'Fire Ant',
        emoji: '🔥',
        team: 'neutral',
        subteam: 'killing',
        description: 'You are a **Fire Ant**! You can douse players with gasoline and ignite them all at once.',
        abilities: ['Douse one player each night', 'Ignite all doused players at once', 'Unstoppable attack when igniting', 'Basic defense'],
        winCondition: 'Be the last one standing',
        nightAction: true,
        actionType: 'arsonist',
        attack: 3, // Unstoppable when igniting
        defense: 1
    },

    // Neutral Evil
    CLOWN_BEETLE: {
        name: 'Clown Beetle',
        emoji: '🤡',
        team: 'neutral',
        subteam: 'evil',
        description: 'You are a **Clown Beetle** (Jester)! Your goal is to get yourself voted out.',
        abilities: ['Act suspicious', 'Get voted out to win', 'After being lynched, haunt one guilty voter'],
        winCondition: 'Get yourself lynched during the day',
        nightAction: false,
        attack: 3, // Unstoppable haunt
        defense: 0
    },
    BOUNTY_HUNTER: {
        name: 'Bounty Hunter',
        emoji: '🎯',
        team: 'neutral',
        subteam: 'evil',
        description: 'You are a **Bounty Hunter** (Executioner)! You have a target that you must get lynched.',
        abilities: ['Get your target lynched', 'If target dies at night, become Clown Beetle'],
        winCondition: 'Get your target lynched during the day',
        nightAction: false,
        attack: 0,
        defense: 1
    },
    SPIDER: {
        name: 'Spider',
        emoji: '🕷️',
        team: 'neutral',
        subteam: 'evil',
        description: 'You are a **Spider** (Witch)! You can control players and make them target who you choose.',
        abilities: ['Control one player each night', 'Choose who they target', 'Win by seeing Bees or Wasps lose'],
        winCondition: 'Live to see Bees or Wasps lose',
        nightAction: true,
        actionType: 'witch',
        attack: 0,
        defense: 1
    },

    // Neutral Benign
    BUTTERFLY: {
        name: 'Butterfly',
        emoji: '🦋',
        team: 'neutral',
        subteam: 'benign',
        description: 'You are a **Butterfly** (Survivor)! You just want to survive.',
        abilities: ['Use vest at night (4 vests)', 'Vest gives powerful defense', 'Win with anyone if you survive'],
        winCondition: 'Survive until the end',
        nightAction: true,
        actionType: 'vest',
        attack: 0,
        defense: 0,
        vests: 4
    },
    AMNESIAC_BEETLE: {
        name: 'Amnesiac Beetle',
        emoji: '🪲',
        team: 'neutral',
        subteam: 'benign',
        description: 'You are an **Amnesiac Beetle**! You can remember a dead player\'s role and join their team.',
        abilities: ['Remember any dead player\'s role', 'Become that role', 'Join their team', 'One-time use'],
        winCondition: 'Remember a role and achieve that role\'s win condition',
        nightAction: true,
        actionType: 'remember',
        attack: 0,
        defense: 0,
        hasRemembered: false
    },
    GUARDIAN_ANT: {
        name: 'Guardian Ant',
        emoji: '🐜',
        team: 'neutral',
        subteam: 'benign',
        description: 'You are a **Guardian Ant**! You are assigned to protect one player.',
        abilities: ['Guard one player each night', 'Powerful defense when guarding', 'Win if your target wins'],
        winCondition: 'Your target survives and wins',
        nightAction: true,
        actionType: 'guardian',
        attack: 0,
        defense: 0
    },
    PIRATE_BEETLE: {
        name: 'Pirate Beetle',
        emoji: '🏴‍☠️',
        team: 'neutral',
        subteam: 'benign',
        description: 'You are a **Pirate Beetle**! Challenge players to duels and win 2 times.',
        abilities: ['Duel one player each night', 'Play rock-paper-scissors', 'Win 2 duels to win the game', 'Roleblock your target'],
        winCondition: 'Win 2 duels',
        nightAction: true,
        actionType: 'pirate_duel',
        attack: 0,
        defense: 0,
        duelsWon: 0
    },
    MATCHMAKER_BEETLE: {
        name: 'Matchmaker Beetle',
        emoji: '💕',
        team: 'neutral',
        subteam: 'benign',
        description: 'You are a **Matchmaker Beetle**! You are secretly linked with another player.',
        abilities: ['Linked with random player (hidden)', 'If one dies, both die', 'Win if your partner wins'],
        winCondition: 'Your linked partner wins',
        nightAction: false,
        attack: 0,
        defense: 0
    },
    GOSSIP_BEETLE: {
        name: 'Gossip Beetle',
        emoji: '🗣️',
        team: 'neutral',
        subteam: 'benign',
        description: 'You are a **Gossip Beetle**! You can send anonymous messages.',
        abilities: ['Send anonymous message each day', 'Message appears to everyone', 'Win by surviving'],
        winCondition: 'Survive until the end',
        nightAction: false,
        attack: 0,
        defense: 0
    },
    MERCENARY: {
        name: 'Mercenary',
        emoji: '💰',
        team: 'neutral',
        subteam: 'benign',
        description: 'You are a **Mercenary**! You have been hired by either the Bees or Wasps (50/50 chance).',
        abilities: ['Fight for assigned team', 'Win with your team'],
        winCondition: 'Your assigned team wins',
        nightAction: false,
        attack: 0,
        defense: 0
    }
};

module.exports = { ROLES };
