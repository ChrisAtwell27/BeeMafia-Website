# Multi-Ability Role Guide

## Overview

The modular ability system **fully supports** roles with multiple night abilities! Players can switch between abilities using tabs and submit actions for each one.

## Current Implementation Status

### ✅ Backend Support
- **Role definitions**: Can have multiple abilities
- **Ability registry**: All abilities are modular and independent
- **Configuration**: Each ability can be customized separately

### ✅ Frontend Support
- **Single ability**: Current `NightActionPanel.js` (basic, single ability)
- **Multiple abilities**: New `MultiAbilityNightPanel.js` (tabbed interface)

## How to Use Multi-Ability Panel

### 1. Replace NightActionPanel in GamePage.js

```javascript
// Change this:
import NightActionPanel from '../components/NightActionPanel';

// To this:
import MultiAbilityNightPanel from '../components/MultiAbilityNightPanel';

// And in the render:
{gameState.phase === 'night' && myRole && (
  <MultiAbilityNightPanel  // Changed from NightActionPanel
    role={myRole}
    targets={gameState.alivePlayers}
    gameId={gameId}
    socket={socket}
  />
)}
```

### 2. Define Multi-Ability Roles

```javascript
const { createRole } = require('./shared/game/roleBuilder');

// Ninja Bee - Can track AND roleblock!
const NINJA_BEE = createRole(
  {
    name: 'Ninja Bee',
    emoji: '🥷',
    team: 'bee',
    description: 'You are a **Ninja Bee**! You can track players AND roleblock them!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  [
    'track',      // Ability 1: See who target visits
    'roleblock'   // Ability 2: Block target's action
  ]
);

// Armed Medic - Heal OR shoot!
const ARMED_MEDIC = createRole(
  {
    name: 'Armed Medic',
    emoji: '⚕️',
    team: 'bee',
    description: 'You can heal players OR use your emergency gun!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  [
    {
      id: 'heal',
      config: {
        selfHealsLeft: 2
      }
    },
    {
      id: 'shoot',
      config: {
        bullets: 2,
        power: 2
      }
    }
  ]
);

// Hybrid Investigator - Two types of investigation!
const HYBRID_INVESTIGATOR = createRole(
  {
    name: 'Hybrid Investigator',
    emoji: '🔬',
    team: 'bee',
    description: 'You have both investigation powers with different limits!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  [
    'investigate_suspicious', // Unlimited uses
    {
      id: 'investigate_exact', // Limited to 3 uses
      config: {
        uses: 3
      }
    }
  ]
);
```

## UI Behavior

### Single Ability Role
Shows one action panel (current behavior):
```
┌─────────────────────────────┐
│ 🔍 Scout Bee Action         │
├─────────────────────────────┤
│ Investigate player exactly  │
│ [Select Player ▼]           │
│ [Submit Action]             │
└─────────────────────────────┘
```

### Multi-Ability Role
Shows tabs to switch between abilities:
```
┌─────────────────────────────────────┐
│ 🥷 Ninja Bee Action                 │
├─────────────────────────────────────┤
│ [Track] [Roleblock ✓]              │ ← Tabs
├─────────────────────────────────────┤
│ Block player's night action         │
│ [Select Player ▼]                   │
│ [Submit Action]                     │
└─────────────────────────────────────┘
```

### Features:
- **Tab Navigation**: Switch between abilities
- **Independent Submission**: Each ability tracks its own submission
- **Visual Feedback**: Submitted abilities show ✓ and disable
- **Charge Tracking**: Each ability shows its remaining uses
- **Smart Filtering**: Only shows abilities with charges remaining

## Example Scenarios

### Scenario 1: Choose Between Two Actions
**Armed Medic** (night 1):
1. See tabs: `[Heal]` `[Shoot]`
2. Choose to heal Player A
3. Submit heal action
4. Heal tab shows ✓ (can't submit again)
5. Can still switch to Shoot tab and use that too!

### Scenario 2: One Ability Runs Out
**Hybrid Investigator** (after using all 3 exact investigations):
1. Only see `[Investigate Suspicious]` tab
2. Exact investigation tab is hidden (no charges)
3. Can only use suspicious investigation now

### Scenario 3: All Abilities Used
**Armed Medic** (after using all heals and bullets):
Shows "No Uses Remaining" message

## Backend Considerations

### Processing Multiple Actions
The backend needs to handle multiple actions from the same player:

```javascript
// Current: One action per player per night
socket.on('night_action', (data) => {
  player.nightAction = {
    action: data.action,
    target: data.target
  };
});

// Multi-ability: Array of actions
socket.on('night_action', (data) => {
  if (!player.nightActions) {
    player.nightActions = [];
  }

  player.nightActions.push({
    action: data.action,
    target: data.target,
    target2: data.target2
  });
});

// Processing night actions
function processNightPhase(game) {
  game.players.forEach(player => {
    if (player.nightActions) {
      player.nightActions.forEach(action => {
        processAction(game, player, action);
      });
    }
  });
}
```

## Design Decisions

### Option 1: Use All Abilities Each Night ✅
- Player can use EVERY ability they have each night
- Example: Ninja can both track AND roleblock
- More powerful but more strategic choices

### Option 2: Choose One Ability Per Night
- Player picks which ONE ability to use
- Example: Ninja either tracks OR roleblocks, not both
- Simpler but more limited

**Recommendation**: Start with Option 1 (use all abilities), it's more interesting and the system is already built for it!

## Migration Path

### Phase 1: Keep Current System (Done ✅)
- `NightActionPanel.js` works with single abilities
- Backward compatible with existing roles

### Phase 2: Add Multi-Ability Support (Ready! ✅)
- Import `MultiAbilityNightPanel.js`
- Works with both single AND multi-ability roles

### Phase 3: Backend Update (TODO)
- Update night action processing to handle multiple actions
- Update action priority system
- Update charge consumption

### Phase 4: Create Multi-Ability Roles (TODO)
- Add new roles with multiple abilities
- Test balance and gameplay

## Example Implementation

```javascript
// In shared/roles/modular.js

// Flexible Protector - Can adapt strategy each night
FLEXIBLE_PROTECTOR: createRole(
  {
    name: 'Flexible Protector',
    emoji: '🛡️',
    team: 'bee',
    description: 'You can heal OR guard depending on the threat!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  [
    'heal',  // Heal for basic attacks
    'guard'  // Guard for powerful protection (but risky)
  ]
),

// Spy Master - Information overload
SPY_MASTER: createRole(
  {
    name: 'Spy Master',
    emoji: '🕵️',
    team: 'bee',
    description: 'You have multiple ways to gather information!',
    winCondition: 'Eliminate all Wasps and harmful Neutrals'
  },
  [
    'lookout',  // See who visits target
    'track',    // See who target visits
    {
      id: 'investigate_suspicious',  // Check if suspicious
      config: { uses: 3 }            // But only 3 times
    }
  ]
),

// Utility Wasp - Swiss army knife of evil
UTILITY_WASP: createRole(
  {
    name: 'Utility Wasp',
    emoji: '🦟',
    team: 'wasp',
    description: 'You have multiple tools to disrupt the Bees!',
    winCondition: 'Equal or outnumber all other players'
  },
  [
    'roleblock',  // Stop someone's action
    'deceive',    // Twist someone's messages
    {
      id: 'poison',     // Kill over time
      config: { uses: 2 }
    }
  ]
)
```

## Testing Multi-Ability Roles

1. Create a test role with 2-3 abilities
2. Assign it to yourself in debug mode
3. Check that:
   - Tabs appear and switch correctly
   - Each ability can be submitted independently
   - Submitted abilities show visual feedback
   - Charges deplete correctly
   - UI handles running out of charges

## Questions & Answers

**Q: Can abilities target different players?**
A: Yes! Track Player A, then roleblock Player B.

**Q: What if an ability has no charges left?**
A: It won't appear in the tabs at all.

**Q: Can I submit actions in any order?**
A: Yes, switch between tabs and submit whenever ready.

**Q: Do abilities execute in order?**
A: They follow the priority system (defined in abilities.js).

**Q: Can I change my mind after submitting?**
A: No, once submitted, that ability is locked for the night.

**Q: What happens if I don't use all abilities?**
A: Unused abilities just don't execute. You don't lose charges.
