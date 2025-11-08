# 🚀 BeeMafia - Quick Start Guide

## Super Simple Setup (No MongoDB Required!)

Your BeeMafia game has been **simplified**! Players just enter a username and play - no accounts, no database required!

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Create Environment Files (Optional)

**Backend** (`backend/.env`):
```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 3. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

You should see:
```
🐝 BeeMafia server running on port 3001
Mode: Simple (No Accounts Required)
ℹ️  Running without database (MongoDB not configured)
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Browser opens automatically at `http://localhost:3000`

### 4. Play!

1. **Enter a username** (3-20 characters)
2. **Create a game** or join an existing one
3. **Wait for 6+ players** to start
4. **Get your secret role** and start playing!

## 🎮 How to Play

### Game Flow
1. **Setup (30s)** - Everyone gets their role
2. **Night (60s)** - Submit night actions
3. **Day (180s)** - Discuss and find the evil players
4. **Voting (120s)** - Vote someone out
5. **Repeat** until a team wins!

### Teams
- **🐝 Bees** - Eliminate all Wasps and harmful Neutrals
- **🐝 Wasps** - Equal or outnumber all other players
- **⚖️ Neutrals** - Various win conditions

### Game Modes
- **Basic** - Balanced classic setup
- **Chaos** - Lots of neutral roles
- **Investigative** - Information warfare
- **Killing** - Blood bath mode

## 📊 Optional: Add MongoDB for Stats

If you want to track player statistics:

1. **Install MongoDB** or use MongoDB Atlas (free)
2. **Add to backend/.env**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/beemafia
   # or for Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beemafia
   ```
3. **Restart backend** - Stats will now be tracked!

## 🌐 Deploy to Digital Ocean

See [README.md](README.md#-deployment-to-digital-ocean) for full deployment guide.

**Quick Deploy:**
1. Create a Droplet (Ubuntu 22.04)
2. Install Node.js
3. Clone repo
4. `npm install` in both folders
5. Build frontend: `npm run build`
6. Use PM2 to run backend
7. Configure Nginx

## 🎯 Port Configuration

- **Backend:** 3001 (WebSocket + API)
- **Frontend Dev:** 3000 (React dev server)
- **Frontend Prod:** Served by Nginx on port 80/443

## 💡 Tips

- **Minimum 6 players** to start a game
- **Maximum 20 players** per game
- **Up to 5 concurrent games** (configurable)
- Use **Wasp chat** during night phase (Wasp team only)
- **Dead chat** available for eliminated players

## 🐛 Troubleshooting

### Backend won't start
- Check port 3001 is not in use
- Make sure Node.js v16+ is installed

### Frontend can't connect
- Check backend is running on port 3001
- Verify REACT_APP_SOCKET_URL in frontend/.env

### Game won't start
- Need at least 6 players
- Host must click "Start Game"

### Players disconnecting
- Check firewall allows WebSocket connections
- Ensure stable internet connection

## 📝 What's Next?

- Invite friends to play!
- Try different game modes
- Explore all 56+ unique roles
- Deploy to a server for 24/7 access

---

**Have fun playing BeeMafia! 🐝**

For more details, see the full [README.md](README.md)
