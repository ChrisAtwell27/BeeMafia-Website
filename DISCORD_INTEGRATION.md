# Discord Voice Chat Integration Guide

## Overview

The BeeMafia game now integrates with Discord voice chat through the BobbyTheBot webhook API. Players are automatically muted/unmuted based on game phase, role effects, and death status.

## How Discord ID Linking Works

### The Problem
The website needs to know which Discord user to mute/unmute in the voice channel. This requires linking website players to their Discord accounts.

### The Solution
Players provide their **Discord User ID** when creating or joining a game. This ID is stored with their player data and used to control their voice permissions.

---

## Backend Implementation ✅

The backend has been fully implemented with:

1. **Discord ID Storage**
   - Added `discordId` field to User model ([User.js:38-43](d:\_My Projects\BeeMafia-Website\BeeMafia-Backend\models\User.js#L38-L43))
   - Players can set Discord ID when creating/joining games
   - Discord ID is preserved throughout game lifecycle

2. **Socket Event Handler**
   - New event: `set_discord_id` ([socketHandler.js:88-90](d:\_My Projects\BeeMafia-Website\BeeMafia-Backend\src\socket\socketHandler.js#L88-L90))
   - Players can update Discord ID while in game lobby (before game starts)

3. **Voice Control Integration**
   - Automatically mutes Mute Bee roles on game start
   - Mutes everyone during night/dusk phases
   - Unmutes alive players during day/voting (except blackmailed/mute bees)
   - Mutes dead players permanently

---

## Frontend Implementation Required ⚠️

You need to add Discord ID input to your frontend. Here are the integration points:

### 1. Game Creation Screen

Add a Discord ID input field when players create a game:

```javascript
// Example: In your CreateGame component
<input
  type="text"
  placeholder="Discord User ID (optional)"
  value={discordId}
  onChange={(e) => setDiscordId(e.target.value)}
/>

// When creating game:
socket.emit('create_game', {
  name: gameName,
  maxPlayers: maxPlayers,
  gameMode: gameMode,
  debugMode: debugMode,
  isPrivate: isPrivate,
  discordId: discordId  // Add this
});
```

### 2. Join Game Screen

Add Discord ID input when joining a game:

```javascript
// Example: In your JoinGame component
<input
  type="text"
  placeholder="Discord User ID (optional)"
  value={discordId}
  onChange={(e) => setDiscordId(e.target.value)}
/>

// When joining game:
socket.emit('join_game', {
  gameId: gameId,
  roomCode: roomCode,
  discordId: discordId  // Add this
});
```

### 3. Game Lobby - Update Discord ID

Allow players to update their Discord ID while in the lobby:

```javascript
// In your GameLobby component
function updateDiscordId(discordId) {
  socket.emit('set_discord_id', { discordId });
}

// Listen for confirmation:
socket.on('discord_id_set', (data) => {
  console.log('Discord ID updated successfully');
});

// Listen for other players' updates:
socket.on('player_discord_updated', (data) => {
  // data = { userId, username, hasDiscordId }
  // Update UI to show which players have linked Discord
});
```

### 4. UI Indicators

Show players who have linked their Discord account:

```javascript
// Example player list display
{players.map(player => (
  <div key={player.userId}>
    <span>{player.username}</span>
    {player.hasDiscordId ? (
      <span className="discord-linked">🔗 Discord Linked</span>
    ) : (
      <span className="discord-not-linked">⚠️ No Discord ID</span>
    )}
  </div>
))}
```

---

## How to Find Your Discord User ID

### Desktop/Web Discord:
1. Enable Developer Mode:
   - Click User Settings (gear icon)
   - Go to Advanced
   - Enable "Developer Mode"

2. Get Your User ID:
   - Right-click your username anywhere
   - Click "Copy User ID"
   - Paste it into the Discord ID field

### Mobile Discord:
1. Enable Developer Mode:
   - Tap your profile
   - Go to App Settings → Advanced
   - Enable "Developer Mode"

2. Get Your User ID:
   - Tap your profile
   - Tap the three dots
   - Select "Copy User ID"

### Example Discord ID:
```
987654321123456789
```

---

## API Reference

### Socket Events

#### `create_game`
```javascript
socket.emit('create_game', {
  name: string,
  maxPlayers: number,
  gameMode: string,
  debugMode: boolean,
  isPrivate: boolean,
  discordId: string  // NEW: Player's Discord user ID
});
```

#### `join_game`
```javascript
socket.emit('join_game', {
  gameId: string,
  roomCode: string,
  discordId: string  // NEW: Player's Discord user ID
});
```

#### `set_discord_id`
```javascript
socket.emit('set_discord_id', {
  discordId: string  // Can update while in lobby
});

// Response:
socket.on('discord_id_set', (data) => {
  // { success: true }
});

// Broadcast to all players:
socket.on('player_discord_updated', (data) => {
  // { userId, username, hasDiscordId }
});
```

---

## Voice Control Behavior

### Phase-Based Muting

| Phase | Mute Status |
|-------|------------|
| Setup | Unmuted |
| Dusk | All muted |
| Night | All muted |
| Day | Unmuted (except dead/blackmailed/mute bees) |
| Voting | Unmuted (except dead/blackmailed/mute bees) |
| Finished | Unmuted |

### Role-Based Muting

1. **Mute Bee Roles** - Permanently muted for entire game
   - Mute Scout Bee
   - Mute Nurse Bee
   - Mute Investigator Bee
   - Mute Bodyguard Bee
   - And all other mute variants

2. **Blackmailed Players** - Muted during day/voting phases
   - Effect lasts one day cycle
   - Cleared at next night phase

3. **Dead Players** - Permanently muted
   - Muted when killed at night
   - Muted when lynched during voting

---

## Testing

### Test Discord ID Linking
```javascript
// In browser console:
// 1. Join game with Discord ID
socket.emit('join_game', {
  gameId: 'your-game-id',
  discordId: '987654321123456789'
});

// 2. Update Discord ID in lobby
socket.emit('set_discord_id', {
  discordId: '123456789987654321'
});

// 3. Start game and check server logs
// Should see: "🤐 Muting player 987654321123456789: Mute Scout Bee - permanently muted"
```

---

## Troubleshooting

### Players Not Being Muted

**Problem:** Players join game but don't get muted/unmuted

**Solutions:**
1. Check if player provided Discord ID when joining
2. Verify Discord ID is correct (18-digit number)
3. Check server logs for voice control errors
4. Ensure MAFIA_WEBHOOK_SECRET is set in .env
5. Verify player is in the Discord voice channel (1434633691455426600)

### Discord ID Not Saving

**Problem:** Discord ID is lost when reconnecting

**Solution:**
- Store Discord ID in user account (future enhancement)
- Currently only persists for session

### Wrong Player Muted

**Problem:** Discord mutes the wrong player

**Solution:**
- Verify players are using their own Discord User ID
- Check for duplicate Discord IDs
- Use Developer Mode in Discord to confirm correct ID

---

## Environment Variables

Required in `.env`:
```env
DISCORD_API_URL=https://bobby-the-bot-i76i6.ondigitalocean.app
MAFIA_WEBHOOK_SECRET=a75bba994a6b37cd0adb25c384cc68ef901fa0edfbfc32bb8b5d7d219268704c
DISCORD_GUILD_ID=701308904877064193
DISCORD_VOICE_CHANNEL_ID=1434633691455426600
```

---

## Future Enhancements

### Option 1: Discord OAuth
Integrate Discord OAuth to automatically get user IDs:
```javascript
// Add Discord OAuth button
<DiscordLoginButton />

// After OAuth, Discord ID is automatically linked
```

### Option 2: Manual Mapping
Host can manually map players to Discord users:
```javascript
// Host interface
{players.map(player => (
  <div>
    <span>{player.username}</span>
    <select onChange={(e) => mapPlayerToDiscord(player.id, e.target.value)}>
      {voiceChannelMembers.map(member => (
        <option value={member.id}>{member.username}</option>
      ))}
    </select>
  </div>
))}
```

### Option 3: QR Code Linking
Generate QR code that opens Discord app and copies user ID

---

## Summary

**What's Working:**
✅ Backend Discord ID storage
✅ Voice control based on game phase
✅ Mute Bee permanent muting
✅ Blackmail temporary muting
✅ Death permanent muting
✅ Socket event handlers

**What's Needed:**
⚠️ Frontend UI for Discord ID input
⚠️ User instructions/tooltip
⚠️ Visual indicators for linked players

Once you add the frontend UI components, the full Discord voice integration will be functional!
