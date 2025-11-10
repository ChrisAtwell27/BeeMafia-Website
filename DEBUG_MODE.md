# 🐛 Debug Mode Guide

Debug mode allows you to test the game quickly without waiting for long timers or gathering many players.

## How to Enable Debug Mode

### When Creating a Game

1. Click **"Create Game"** in the lobby
2. Fill in game details
3. ✅ **Check the "Debug Mode" checkbox**
4. Click **Create**

The game will show a **🐛 DEBUG** badge in the lobby.

## Debug Mode Features

### ⚡ Faster Phase Timers

| Phase | Normal | Debug Mode |
|-------|--------|------------|
| Setup | 30 seconds | 10 seconds |
| Night | 60 seconds | 45 seconds |
| Day | 180 seconds (3 min) | 90 seconds (1.5 min) |
| Voting | 120 seconds (2 min) | 60 seconds (1 min) |

**Total game cycle:** 6.5 minutes vs ~3.5 minutes per night/day cycle

### 👥 Fewer Players Required + Manual Bot Addition

- **Normal Mode:** Minimum 6 players
- **Debug Mode:** Minimum **1 player**

**🤖 Bot Players:**
- **Click "Add Bots" button** in the game lobby to add 11 bots instantly
- Only available in debug mode and only the host can add bots
- Bots have enhanced AI with "meta knowledge" - they make smarter decisions in debug mode
- Bots can investigate, protect, attack, and vote intelligently
- Perfect for solo testing - add bots and you're ready to start!
- Bot names: BotAlice, BotBob, BotCharlie, BotDiana, BotEve, BotFrank, BotGrace, BotHank, BotIvy, BotJack, BotKate (and BotLeo if needed)

## When to Use Debug Mode

✅ **Use Debug Mode for:**
- Testing game mechanics
- Learning how roles work
- Quick practice games
- Development/debugging
- Testing with limited players

❌ **Don't Use Debug Mode for:**
- Serious competitive games
- Full player experience
- When you want proper discussion time

## Visual Indicators

Debug games show:
- 🐛 **DEBUG** badge on the game card in lobby
- ⚡ "DEBUG MODE: Fast timers, manual bot addition" message
- 🤖 **"Add Bots"** button next to "Start Game" (host only)
- Orange warning color scheme

## Example Debug Game Flow

```
1. Setup Phase (10s)
   └─ Roles assigned, check your role

2. Night 1 (45s)
   └─ Submit night actions quickly

3. Day 1 (90s)
   └─ Quick discussion

4. Voting (60s)
   └─ Vote someone out

5. Repeat...
```

**Total time for 3 full cycles:** ~10-12 minutes instead of ~20+ minutes

## Tips for Debug Testing

1. **Solo Testing with Bots:**
   - Create a debug game with just yourself
   - **Click "Add Bots" button** to add 11 bots instantly (lobby fills to 12/12!)
   - Perfect for testing your role's night actions
   - See how the game flows with intelligent bot behavior
   - Bots make smart decisions (target actual wasps, protect key players, etc.)

2. **Test Specific Roles:**
   - Use debug mode to quickly iterate
   - Add bots to provide targets for your actions
   - Test win conditions with bot players
   - Enhanced bot AI helps games reach actual conclusions

3. **Test Game Flow:**
   - Verify phase transitions work
   - Check voting mechanics (bots vote intelligently!)
   - Test win conditions with smart bot play
   - Games complete faster with bot meta-knowledge

4. **Test UI/Features:**
   - Chat functionality
   - Role cards display
   - Night action submission
   - Voting interface
   - 12-player lobby displays correctly

5. **Multi-Player Debug Testing:**
   - Create debug game and add bots
   - Open incognito window for additional real players
   - Great for testing interactions in a full lobby
   - You can add fewer bots if desired (button adds 11 by default)

## Creating a Debug Test Game

```javascript
// Quick debug game setup:
1. Enter username: "TestPlayer1"
2. Create Game:
   - Name: "Debug Test"
   - Max Players: 12 (recommended for debug)
   - Mode: Basic
   - ✅ Debug Mode: ON
3. Click **"Add Bots"** button to add 11 bots - lobby fills to 12/12!
4. Click "Start Game" - ready to go immediately!

// Alternative - Testing with multiple humans:
1-2. Create debug game as above
3. Open new tab (incognito)
4. Enter username: "TestPlayer2"
5. Join the game (now 2 humans)
6. Host clicks "Add Bots" to add 11 bots (or fewer)
7. Start game - only 1 player needed!
```

## Debug Mode Technical Details

The debug mode flag is passed through the entire game lifecycle:

```
Frontend (Checkbox)
  → WebSocket (create_game event)
    → Backend (gameRoom.debugMode)
      → Game Constants (getGameConstants())
        → Phase Timers
```

All game logic remains the same - only timers and player requirements change!

## Troubleshooting

**"Can't see Add Bots button"**
- Make sure the debug checkbox was checked when creating
- Look for the 🐛 badge on the game card
- Only the **host** can see and use the Add Bots button
- Button only appears in the waiting lobby, not during gameplay

**"Still requires 6 players"**
- Verify the game shows "DEBUG" badge in lobby
- Debug mode requires only 1 player to start
- Try creating a new game with debug mode enabled

**"Timers are still long"**
- Check that the game shows "DEBUG" badge
- Timers are set when the game starts
- Debug timers: 10s setup, 45s night, 90s day, 60s vote

**"Can't find debug option"**
- Look in "Advanced Options" when creating a game
- Make sure you're clicking "Create Game" not "Join Game"
- Check that you're on the latest version

**"Bots didn't add"**
- Make sure you clicked the "Add Bots" button
- Check that you have available slots (not already at max players)
- The button adds up to 11 bots or fills remaining slots
- Toast notification will confirm how many bots were added

---

Happy debugging! 🐛🐝
