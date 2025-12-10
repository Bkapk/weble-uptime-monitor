# Setup Instructions for Weble Uptime

## Database Setup (MongoDB Atlas - Free Tier)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Click "Build a Database"
4. Choose **FREE** (M0 Sandbox) tier
5. Select a cloud provider and region close to you
6. Name your cluster (default is fine)
7. Click "Create"

### Step 2: Create Database User
1. Under "Security" → "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these!)
5. Set permissions to "Read and write to any database"
6. Click "Add User"

### Step 3: Allow Network Access
1. Under "Security" → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs for better security
4. Click "Confirm"

### Step 4: Get Connection String
1. Click "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `weble_uptime`

Example:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the project root:
```bash
MONGODB_URI=your_connection_string_here
PORT=3001
```

3. Start the backend:
```bash
npm start
```

4. Start the frontend (in a new terminal):
```bash
npm run dev
```

5. Open browser: http://localhost:3000
   - Password: `Weble2024.`

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variable:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string
4. Deploy!

### Option 2: Railway
1. Connect GitHub repo to [Railway](https://railway.app)
2. Add environment variable `MONGODB_URI`
3. Deploy automatically

### Option 3: Render
1. Connect GitHub repo to [Render](https://render.com)
2. Add environment variable `MONGODB_URI`
3. Deploy

## Environment Variables

Required for production:
- `MONGODB_URI` - MongoDB connection string (required)
- `PORT` - Server port (optional, defaults to 3001)

## Testing Database Connection

After setup, check the console when starting the server:
- ✅ = Database connected successfully
- ❌ = Connection failed (check your connection string)

## Default Settings

- Check interval: 3600 seconds (1 hour)
- Max history points: 30
- Password: `Weble2024.`
- Cookie expiration: 7 days

