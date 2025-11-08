# BeeMafia Deployment Guide

## Project Structure

```
BeeMafia/
├── shared/                 # Shared package used by both frontend & backend
│   ├── package.json
│   ├── index.js
│   ├── roles.js
│   └── game/
├── BeeMafia-Frontend/     # React frontend
└── BeeMafia-Backend/      # Node.js backend
```

## The Shared Package

The `shared` folder is a local npm package (`@beemafia/shared`) that contains:
- Role definitions
- Game utilities
- Shared constants and logic

Both frontend and backend import it as a dependency using `"@beemafia/shared": "file:../shared"`.

## Local Development

### First Time Setup

```bash
# Install backend dependencies
cd BeeMafia-Backend
npm install  # This also installs the shared package

# Install frontend dependencies
cd ../BeeMafia-Frontend
npm install  # This also installs the shared package
```

### Running Locally

**Backend:**
```bash
cd BeeMafia-Backend
npm run dev
```

**Frontend:**
```bash
cd BeeMafia-Frontend
npm start
```

## Deployment

### Option 1: Deploy Full Monorepo (Recommended)

Deploy the entire BeeMafia folder to both servers. The shared package is accessible via relative paths.

#### Frontend Deployment (Vercel/Netlify/Azure)

**Vercel Configuration:**
```json
{
  "buildCommand": "cd BeeMafia-Frontend && npm install && npm run build",
  "outputDirectory": "BeeMafia-Frontend/build",
  "installCommand": "npm install"
}
```

**Netlify Configuration:**
```toml
[build]
  base = "BeeMafia-Frontend"
  command = "npm install && npm run build"
  publish = "build"
```

#### Backend Deployment (Digital Ocean Droplet)

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Clone the repo
git clone https://github.com/yourusername/BeeMafia.git /var/www/beemafia
cd /var/www/beemafia

# Install backend
cd BeeMafia-Backend
npm install

# Start with PM2
pm2 start src/server.js --name beemafia-backend
pm2 save
pm2 startup

# Setup nginx reverse proxy (optional)
sudo nano /etc/nginx/sites-available/beemafia
```

**Nginx config example:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Separate Repos with Shared Package

If you want separate repos for frontend and backend:

1. Create 3 repos:
   - `BeeMafia-Frontend`
   - `BeeMafia-Backend`
   - `BeeMafia-Shared`

2. In each frontend/backend repo, update package.json:
   ```json
   "@beemafia/shared": "git+https://github.com/yourusername/BeeMafia-Shared.git"
   ```

3. When you update shared code, bump the version and both repos will pull the latest.

## Updating After Changes

### Frontend
```bash
cd BeeMafia-Frontend
npm install  # Reinstalls shared package with latest changes
npm run build
```

### Backend (on droplet)
```bash
cd /var/www/beemafia
git pull
cd BeeMafia-Backend
npm install  # Reinstalls shared package with latest changes
pm2 restart beemafia-backend
```

## How Imports Work

**Backend:**
```javascript
const { ROLES } = require('@beemafia/shared');
// or
const { ROLES } = require('../shared/roles');  // Still works!
```

**Frontend:**
```javascript
import { ROLES } from '@beemafia/shared';
```

The `file:../shared` dependency creates a symlink in `node_modules/@beemafia/shared` pointing to your local shared folder.

## Benefits of This Approach

✅ **DRY** - Single source of truth for roles and game logic
✅ **Type Safety** - Both apps use identical data structures
✅ **Easy Updates** - Change roles once, applies to both
✅ **Deployment Ready** - Works on any platform
✅ **No Build Step** - Shared code is just JavaScript
✅ **Version Control** - All code in one repo (or easily split)

## Troubleshooting

**"Cannot find module '@beemafia/shared'"**
```bash
# Run npm install in the project
cd BeeMafia-Backend (or BeeMafia-Frontend)
npm install
```

**Changes to shared code not reflecting**
```bash
# Reinstall the package
npm install --force
# or
rm -rf node_modules/@beemafia
npm install
```

**Deployment errors about shared folder**
- Make sure the shared folder is included in your git repo
- Check that package.json has `"@beemafia/shared": "file:../shared"`
- Verify the relative path is correct for your deployment structure
