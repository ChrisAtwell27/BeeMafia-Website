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

### 👥 Fewer Players Required + Auto-Fill Bots

- **Normal Mode:** Minimum 6 players
- **Debug Mode:** Minimum **2 players**

**🤖 Bot Players:**
- If you start a debug game with fewer than 6 players, bots automatically fill the remaining slots
- Bots perform random night actions and vote randomly
- Perfect for solo testing - start with just 1 player and 5 bots will join!
- Bot names: BotAlice, BotBob, BotCharlie, etc.

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
- ⚡ "Fast timers, 2+ players to start" message
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
   - 5 bots will automatically join
   - Perfect for testing your role's night actions
   - See how the game flows with bot behavior

2. **Test Specific Roles:**
   - Use debug mode to quickly iterate
   - Bots will provide targets for your actions
   - Test win conditions with bot players

3. **Test Game Flow:**
   - Verify phase transitions work
   - Check voting mechanics (bots vote too!)
   - Test win conditions

4. **Test UI/Features:**
   - Chat functionality
   - Role cards display
   - Night action submission
   - Voting interface

5. **Multi-Player Debug Testing:**
   - Open incognito window for 2nd player
   - Remaining slots fill with bots
   - Great for testing interactions between real players

## Creating a Debug Test Game

```javascript
// Quick debug game setup:
1. Enter username: "TestPlayer1"
2. Create Game:
   - Name: "Debug Test"
   - Max Players: 6
   - Mode: Basic
   - ✅ Debug Mode: ON
3. Open new tab (incognito)
4. Enter username: "TestPlayer2"
5. Join the game
6. Start game (only 2 players needed!)
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

**"Still requires 6 players"**
- Make sure the debug checkbox was checked when creating
- Look for the 🐛 badge on the game card
- Try creating a new game

**"Timers are still long"**
- Check that the game shows "DEBUG" badge
- Timers are set when the game starts, not when created
- Try restarting the game

**"Can't find debug option"**
- Make sure you're on the latest version
- Check that you're clicking "Create Game" not "Join Game"

---

Happy debugging! 🐛🐝
