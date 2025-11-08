# MongoDB Setup Guide for BeeMafia

## Option 1: Local MongoDB (Development)

### Windows Installation

1. **Download MongoDB Community Server**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Download and run the installer

2. **Installation Steps**
   - Choose "Complete" installation
   - Install as a Service (recommended)
   - Install MongoDB Compass (GUI tool) - check this option
   - Default data directory: `C:\Program Files\MongoDB\Server\7.0\data`

3. **Verify Installation**
   ```bash
   # Open Command Prompt and run:
   mongod --version
   ```

4. **Start MongoDB Service**
   ```bash
   # MongoDB should auto-start as a service
   # To manually start:
   net start MongoDB

   # To stop:
   net stop MongoDB
   ```

5. **Test Connection**
   ```bash
   # Open MongoDB Shell
   mongosh

   # You should see: Current Mongosh Log ID: ...
   # Type 'exit' to quit
   ```

6. **Update Backend .env**
   ```env
   MONGODB_URI=mongodb://localhost:27017/beemafia
   ```

### Alternative: MongoDB with Docker (Easier)

If you have Docker installed:

1. **Create docker-compose.yml** in project root:
   ```yaml
   version: '3.8'
   services:
     mongodb:
       image: mongo:7.0
       container_name: beemafia-mongo
       ports:
         - "27017:27017"
       volumes:
         - mongodb_data:/data/db
       environment:
         - MONGO_INITDB_DATABASE=beemafia

   volumes:
     mongodb_data:
   ```

2. **Start MongoDB**
   ```bash
   docker-compose up -d
   ```

3. **Update Backend .env**
   ```env
   MONGODB_URI=mongodb://localhost:27017/beemafia
   ```

---

## Option 2: MongoDB Atlas (Cloud - Recommended for Production) ☁️

### Free Tier Setup (No Credit Card Required)

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with Google/GitHub or email

2. **Create Free Cluster**
   - Click "Build a Database"
   - Choose "M0 Free" tier
   - Select a region close to you (e.g., AWS - US East)
   - Cluster name: `BeeMafia` (or leave default)
   - Click "Create"

3. **Setup Database Access**
   - Click "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `beemafia_user`
   - Password: (auto-generate or create your own) - **SAVE THIS!**
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Click "Network Access" (left sidebar)
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your Digital Ocean droplet IP
   - Click "Confirm"

5. **Get Connection String**
   - Click "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy the connection string, looks like:
     ```
     mongodb+srv://beemafia_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

6. **Update Backend .env**
   ```env
   MONGODB_URI=mongodb+srv://beemafia_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/beemafia?retryWrites=true&w=majority
   ```

   Replace:
   - `YOUR_PASSWORD` with the password you created
   - `cluster0.xxxxx` with your actual cluster URL
   - Add `/beemafia` before the `?` to specify database name

---

## Verifying MongoDB Connection

### Test Your Connection

1. **Create a test script** `backend/test-db.js`:
   ```javascript
   require('dotenv').config();
   const mongoose = require('mongoose');

   async function testConnection() {
       try {
           await mongoose.connect(process.env.MONGODB_URI);
           console.log('✅ MongoDB connected successfully!');
           console.log('Database:', mongoose.connection.name);
           console.log('Host:', mongoose.connection.host);

           // List collections
           const collections = await mongoose.connection.db.listCollections().toArray();
           console.log('Collections:', collections.map(c => c.name));

           await mongoose.connection.close();
           console.log('Connection closed');
       } catch (error) {
           console.error('❌ MongoDB connection error:', error.message);
           process.exit(1);
       }
   }

   testConnection();
   ```

2. **Run the test**:
   ```bash
   cd backend
   node test-db.js
   ```

   Expected output:
   ```
   ✅ MongoDB connected successfully!
   Database: beemafia
   Host: localhost (or your Atlas cluster)
   Collections: []
   Connection closed
   ```

---

## MongoDB GUI Tools (Optional)

### MongoDB Compass (Recommended)
- Download: https://www.mongodb.com/products/compass
- Connect using your MONGODB_URI
- Visual interface to browse data, run queries, etc.

### VS Code Extension
1. Install "MongoDB for VS Code" extension
2. Connect using your connection string
3. Browse databases directly in VS Code

---

## Initial Database Setup

When you first run the backend, it will automatically:
1. Create the `beemafia` database
2. Create collections: `users`, `games`
3. Set up indexes

You don't need to manually create anything!

---

## Common Issues & Solutions

### Issue: "MongooseServerSelectionError"
**Solution:**
- Check if MongoDB service is running: `net start MongoDB`
- Verify connection string in .env
- Check firewall settings

### Issue: "Authentication failed"
**Solution:**
- Double-check username and password
- Make sure you replaced `<password>` with actual password
- Password shouldn't contain special characters like `@`, `#` in Atlas

### Issue: "Network timeout"
**Solution:**
- Check Network Access whitelist in Atlas
- Make sure your IP is allowed
- Try "Allow from anywhere" for testing

### Issue: "Database connection refused"
**Solution:**
- Make sure MongoDB is running locally
- Check port 27017 is not blocked
- Try: `telnet localhost 27017`

---

## Production Recommendations

For Digital Ocean deployment:

### Option A: MongoDB Atlas (Recommended)
- ✅ Free tier available
- ✅ Automatic backups
- ✅ No server maintenance
- ✅ Built-in monitoring
- ❌ Slight latency (cloud to cloud)

### Option B: Self-hosted on Droplet
- ✅ Lower latency
- ✅ Full control
- ❌ You manage backups
- ❌ You handle updates/security

**Recommendation:** Start with Atlas free tier, upgrade to paid Atlas or self-hosted when needed.

---

## Environment Variables Reference

```env
# Local Development
MONGODB_URI=mongodb://localhost:27017/beemafia

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/beemafia?retryWrites=true&w=majority

# With Authentication (Local)
MONGODB_URI=mongodb://username:password@localhost:27017/beemafia

# Production (DO Droplet with local MongoDB)
MONGODB_URI=mongodb://localhost:27017/beemafia
```

---

## Quick Start Commands

```bash
# 1. Start MongoDB (Windows)
net start MongoDB

# 2. Create .env file
cd backend
copy .env.example .env

# 3. Edit .env and set MONGODB_URI

# 4. Install dependencies
npm install

# 5. Test connection
node test-db.js

# 6. Start server
npm run dev

# Server should show:
# ✅ MongoDB Connected: localhost (or your cluster)
# 🐝 BeeMafia server running on port 3001
```

---

## Next Steps

After MongoDB is set up:

1. ✅ MongoDB running (local or Atlas)
2. ✅ Backend .env configured
3. ✅ Test connection successful
4. 🚀 Start backend: `npm run dev`
5. 🚀 Start frontend: `cd ../frontend && npm start`
6. 🎮 Create account and play!

Happy gaming! 🐝
