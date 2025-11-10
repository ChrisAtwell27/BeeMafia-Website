# Custom Role Creation Guide

## Overview

The BeeMafia game now uses a **completely modular ability system**! This means you can create custom roles by simply picking abilities from a registry and configuring their values (integers, booleans, etc.). No more hardcoded logic!

## How It Works

### 1. Abilities Are Modules

Each ability is self-contained in `shared/game/abilities.js` with:
- **ID**: Unique identifier (e.g., `'investigate_suspicious'`)
- **Configuration Schema**: What values can be customized (uses, power, bullets, etc.)
- **Target Type**: none, single, double, dead
- **Default Values**: Sensible defaults for all config options
- **Priority**: When the ability executes in night phase

### 2. Roles Are Just Configurations

Roles are now created by:
1. Basic info (name, emoji, team, description)
2. Array of ability IDs with optional config overrides

That's it! No more manually setting `nightAction`, `actionType`, `attack`, `defense`, `bullets`, etc. - **it's all automatic!**

## Creating Custom Roles

### Simple Example - Role with Default Ability

```javascript
const { createRole } = require('./shared/game/roleBuilder');

// Investigator with default settings
const INVESTIGATOR = createRole(
  {
    name: 'Investigator',
    emoji: '🔍',
    team: 'bee',
    description: 'You can investigate players each night!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  ['investigate_suspicious'] // Just add the ability ID!
);
```

### Custom Configuration Example

```javascript
// Armed Medic - healer with 2 bullets!
const ARMED_MEDIC = createRole(
  {
    name: 'Armed Medic',
    emoji: '⚕️🔫',
    team: 'bee',
    description: 'You can heal players AND you have 2 emergency bullets!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  [
    'heal',                    // Healing ability with defaults
    {
      id: 'shoot',
      config: {
        bullets: 2,            // Custom: 2 bullets instead of default
        power: 2               // Custom: Powerful attack instead of basic
      }
    }
  ]
);
```

### Multiple Abilities Example

```javascript
// Super Investigator - can do BOTH types of investigation!
const SUPER_INVESTIGATOR = createRole(
  {
    name: 'Super Investigator',
    emoji: '🔬',
    team: 'bee',
    description: 'You have both investigation powers!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  [
    'investigate_suspicious',  // Unlimited suspicious checks
    {
      id: 'investigate_exact', // Exact role checks
      config: {
        uses: 3                // But only 3 times
      }
    }
  ]
);
```

### Limited Use Abilities

```javascript
// Survivor with custom vests
const SURVIVOR_PLUS = createRole(
  {
    name: 'Survivor Plus',
    emoji: '🦋',
    team: 'neutral',
    subteam: 'benign',
    description: 'You want to survive with extra protection!',
    winCondition: 'Survive until the end'
  },
  [
    {
      id: 'vest',
      config: {
        vests: 6,             // 6 vests instead of default 4
        power: 3              // Unstoppable protection!
      }
    }
  ]
);
```

## Available Abilities

### Investigation
- `investigate_suspicious` - Learn if player is suspicious
- `investigate_exact` - Learn exact role
- `lookout` - See who visits target
- `track` - See who target visits
- `spy` - See all Wasp visits
- `psychic` - Vision of 3 players, one is evil
- `beekeeper` - Learn number of Wasps alive
- `librarian` - Check for limited-use abilities
- `pollinate` - See visits on player after X nights

### Protection
- `heal` - Protect from basic attacks (config: selfHealsLeft, power)
- `guard` - Die protecting target (config: power)
- `vest` - Self-protection (config: vests, power)
- `trap` - Roleblock attackers (config: uses)

### Killing
- `mafia_kill` - Wasp team kill (config: power)
- `serial_kill` - Neutral killer (config: power)
- `shoot` - Limited bullets (config: bullets, power)
- `poison` - Delayed kill (config: delay, power)
- `alert` - Kill visitors (config: alerts, power)

### Disruption
- `roleblock` - Prevent action (config: uses)
- `jail` - Protect + roleblock (config: executions)
- `blackmail` - Silence player (config: uses)
- `sabotage` - Silent fail (config: uses)

### Support
- `transport` - Swap targets (config: uses)

### Deception
- `deceive` - Twist messages (config: uses)
- `hypnotize` - False feedback (config: uses)
- `clean` - Hide dead role (config: cleans)
- `disguise` - Appear as dead player (config: disguises)
- `mimic` - Appear as role (config: mimics)
- `silencer` - Block results (config: silences)

## Configuration Options

Each ability can have these configurable properties:

### Common Configurations
- `unlimited` (boolean) - Whether ability has infinite uses
- `uses` (number) - Limited charges (null = unlimited)
- `power` (number) - Attack/defense level (1=basic, 2=powerful, 3=unstoppable)
- `delay` (number) - Nights until effect (for poison, pollinate)

### Specific Configurations
- `bullets` (number) - For shoot ability
- `vests` (number) - For vest ability
- `alerts` (number) - For alert ability
- `selfHealsLeft` (number) - For heal ability
- `executions` (number) - For jail ability
- `cleans` (number) - For clean ability
- `disguises` (number) - For disguise ability
- `mimics` (number) - For mimic ability
- `silences` (number) - For silencer ability

## For Custom Role Maker UI

When building the custom role maker interface:

1. **Role Basic Info Form**
   - Name (text input)
   - Emoji (emoji picker)
   - Team (dropdown: bee, wasp, neutral)
   - Description (textarea)

2. **Ability Picker**
   - Show all abilities from `ABILITIES` registry
   - Display: icon + name + description
   - Category filters (investigate, protect, kill, etc.)

3. **Ability Configuration**
   - When user selects an ability, show its `config` schema
   - Generate form inputs based on type:
     - boolean → checkbox
     - number → number input with min/max
   - Show default values as placeholders

4. **Preview**
   - Show computed attack/defense
   - Show win condition
   - Preview role card

## Example: UI Flow

```javascript
// User picks abilities in UI
const selectedAbilities = [
  {
    id: 'heal',
    config: {
      selfHealsLeft: 2,  // User set via number input
      power: 1
    }
  },
  {
    id: 'shoot',
    config: {
      bullets: 1,        // User set via number input
      power: 2
    }
  }
];

// System creates the role
const customRole = createRole(
  {
    name: userInput.name,
    emoji: userInput.emoji,
    team: userInput.team,
    description: userInput.description,
    winCondition: getWinCondition(userInput.team)
  },
  selectedAbilities
);

// Role is ready to use!
// - Attack/defense computed automatically
// - Frontend UI renders dynamically
// - Backend processing is generic
```

## Benefits

### ✅ Before (Hardcoded)
```javascript
NURSE_BEE: {
  name: 'Nurse Bee',
  emoji: '⚕️',
  team: 'bee',
  description: '...',
  abilities: ['Heal one player...'], // Descriptive only
  winCondition: '...',
  nightAction: true,              // Manual
  actionType: 'heal',              // Manual
  attack: 0,                       // Manual
  defense: 0,                      // Manual
  selfHealsLeft: 1                 // Manual
}
```

### ✅ After (Modular)
```javascript
NURSE_BEE: createRole(
  {
    name: 'Nurse Bee',
    emoji: '⚕️',
    team: 'bee',
    description: '...',
    winCondition: '...'
  },
  [
    {
      id: 'heal',
      config: { selfHealsLeft: 1 }  // Just the config!
    }
  ]
)
```

**Everything else is automatic!**

## Next Steps

1. ✅ Ability registry created (`shared/game/abilities.js`)
2. ✅ Role builder created (`shared/game/roleBuilder.js`)
3. ✅ Frontend updated to use modular system
4. ⏳ Backend needs update to process abilities generically
5. ⏳ Convert existing roles to modular format
6. ⏳ Build Custom Role Maker UI

## Notes

- All ability logic is in ONE place (`abilities.js`)
- UI automatically adapts to any ability configuration
- Backend processing will be generic (no switch statements!)
- Easy to add new abilities - just add to registry
- Easy to create custom roles - just pick and configure
