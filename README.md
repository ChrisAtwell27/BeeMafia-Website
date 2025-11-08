# 🐝 BeeMafia - Web-based Mafia Game

A sophisticated multiplayer social deduction game inspired by Town of Salem, with a bee-themed twist! Originally a Discord bot, now fully playable on the web with real-time WebSocket communication.

## 🎮 Features

### Game Features
- **56+ Unique Roles** across 3 teams (Bees, Wasps, Neutrals)
- **Multiple Game Phases** (Setup → Night → Day → Voting)
- **Real-time Multiplayer** with WebSocket support
- **Multiple Game Modes** (Basic, Chaos, Investigative, Killing)
- **Complex Night Actions** - 40+ different action types
- **Team Chat System** (All chat, Wasp chat, Dead chat)
- **Attack/Defense System** with 4 levels each
- **Win Conditions** for teams and individual roles
- **Player Statistics** tracking wins, losses, and more
- **In-game Currency** system

### Technical Features
- **Backend:** Node.js, Express, Socket.io, MongoDB
- **Frontend:** React, React Router, Socket.io Client
- **Authentication:** JWT-based secure authentication
- **Real-time Communication:** WebSocket with Socket.io
- **Scalable Architecture:** Separated game logic for reusability
- **AI Integration:** OpenAI API for special role abilities

## 📁 Project Structure

```
BeeMafia/
├── backend/                 # Express server
│   ├── src/
│   │   ├── server.js       # Main server file
│   │   ├── config/         # Database configuration
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   └── socket/         # WebSocket handlers
│   └── models/             # MongoDB schemas
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context (Auth, Socket)
│   │   └── utils/         # Utility functions
│   └── public/
├── shared/                # Platform-agnostic game logic
│   ├── game/             # Game state, utils, presets
│   └── roles/            # Role definitions
└── discordbotcode/       # Original Discord bot (for reference)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16 or higher
- **MongoDB** (local or Atlas)
- **npm** or **yarn**
- **OpenAI API Key** (optional, for special roles)

### Installation

1. **Clone the repository**
   ```bash
   cd d:\_My Projects\BeeMafia
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up Environment Variables**

   Create `.env` file in the `backend` directory:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/beemafia
   JWT_SECRET=your-super-secret-key-change-this
   JWT_EXPIRES_IN=7d
   OPENAI_API_KEY=your-openai-api-key-optional
   CORS_ORIGIN=http://localhost:3000
   MAX_CONCURRENT_GAMES=5
   MAX_PLAYERS_PER_GAME=20
   MIN_PLAYERS_PER_GAME=6
   ```

   Create `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_SOCKET_URL=http://localhost:3001
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   # or
   npm start
   ```

7. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```

8. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🌐 Deployment to Digital Ocean

### Option 1: Droplet Deployment

1. **Create a Droplet**
   - Choose Ubuntu 22.04 LTS
   - Select appropriate size (2GB RAM minimum)
   - Add SSH keys

2. **Connect to Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs

   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   apt update
   apt install -y mongodb-org
   systemctl start mongod
   systemctl enable mongod

   # Install PM2 for process management
   npm install -g pm2

   # Install Nginx
   apt install -y nginx
   ```

4. **Clone and Setup Project**
   ```bash
   cd /var/www
   git clone <your-repo-url> beemafia
   cd beemafia

   # Backend setup
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with production values
   nano .env

   # Frontend setup
   cd ../frontend
   npm install
   # Create production .env
   echo "REACT_APP_API_URL=https://your-domain.com/api" > .env
   echo "REACT_APP_SOCKET_URL=https://your-domain.com" >> .env
   npm run build
   ```

5. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/beemafia
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /var/www/beemafia/frontend/build;
           index index.html;
           try_files $uri /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # WebSocket
       location /socket.io {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

   Enable site:
   ```bash
   ln -s /etc/nginx/sites-available/beemafia /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

6. **Start Backend with PM2**
   ```bash
   cd /var/www/beemafia/backend
   pm2 start src/server.js --name beemafia-backend
   pm2 startup
   pm2 save
   ```

7. **Setup SSL with Certbot (Optional but Recommended)**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

### Option 2: App Platform Deployment

1. **Prepare for App Platform**
   - Fork the repository to your GitHub
   - Add `Dockerfile` for backend if needed

2. **Create App on Digital Ocean**
   - Go to Digital Ocean App Platform
   - Connect your GitHub repository
   - Configure environment variables
   - Deploy!

3. **Add MongoDB Database**
   - Create a managed MongoDB database
   - Update MONGODB_URI in environment variables

## 📖 How to Play

### Teams

**🐝 Bee Team (Town)**
- Win by eliminating all Wasps and harmful Neutrals
- Roles: Queen's Guard, Scout Bee, Nurse Bee, Bodyguard, and more

**🐝 Wasp Team (Mafia)**
- Win by equaling or outnumbering all other players
- Roles: Wasp Queen, Killer Wasp, Deceiver Wasp, and more

**⚖️ Neutral Team**
- Various win conditions depending on role
- Roles: Murder Hornet, Butterfly, Clown Beetle, and more

### Game Flow

1. **Setup Phase (30s)** - Players receive their roles privately
2. **Night Phase (60s)** - Players with night actions submit their targets
3. **Day Phase (180s)** - Discuss and figure out who's evil!
4. **Voting Phase (120s)** - Vote to eliminate a suspected player
5. **Repeat** until a team wins

### Commands & Actions

- **During Night:** Submit actions through the UI panel
- **During Day:** Chat with all players to discuss suspicions
- **During Voting:** Click on a player to vote them out
- **Wasp Chat:** Available to Wasp team members at night
- **Dead Chat:** Dead players can communicate with each other

## 🎯 Game Modes

- **Basic:** Balanced classic setup with standard roles
- **Chaos:** Maximum chaos with unpredictable neutral roles
- **Investigative:** Information warfare with lots of investigative roles
- **Killing:** Blood bath mode with lots of killing roles

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start  # Runs on port 3000
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🛠️ Tech Stack

**Backend:**
- Express.js - Web framework
- Socket.io - Real-time WebSocket communication
- MongoDB + Mongoose - Database and ODM
- JWT - Authentication
- bcryptjs - Password hashing
- OpenAI API - AI-powered role abilities

**Frontend:**
- React 18 - UI framework
- React Router - Client-side routing
- Socket.io Client - WebSocket client
- Axios - HTTP client
- React Toastify - Notifications

## 📝 API Documentation

### Authentication Endpoints

**POST** `/api/auth/register`
- Register a new user
- Body: `{ username, email, password }`

**POST** `/api/auth/login`
- Login user
- Body: `{ username, password }`
- Returns: JWT token

**GET** `/api/auth/me`
- Get current user profile
- Requires: JWT token

### Game Endpoints

**GET** `/api/game/history`
- Get user's game history
- Requires: JWT token

**GET** `/api/game/leaderboard`
- Get top players leaderboard

**GET** `/api/game/stats`
- Get detailed user statistics
- Requires: JWT token

### WebSocket Events

**Client → Server:**
- `join_lobby` - Join the game lobby
- `create_game` - Create a new game
- `join_game` - Join an existing game
- `start_game` - Start game (host only)
- `night_action` - Submit night action
- `vote` - Submit vote
- `chat_message` - Send chat message

**Server → Client:**
- `lobby_state` - Current lobby state
- `game_started` - Game has started
- `role_assigned` - Player's role assignment
- `phase_changed` - Game phase changed
- `night_results` - Results of night actions
- `player_lynched` - Voting results
- `game_ended` - Game over

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Town of Salem and Werewolf/Mafia
- Original Discord bot implementation
- Bee-themed roles and artwork

## 📧 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Contact: [Your Email]

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] More roles and game modes
- [ ] Ranked matchmaking
- [ ] Spectator mode
- [ ] Replay system
- [ ] Custom role creator
- [ ] Achievements and badges
- [ ] Voice chat integration
- [ ] Tournament system

---

Made with ❤️ and 🐝
