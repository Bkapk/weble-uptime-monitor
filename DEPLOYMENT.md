# Quick Deployment Guide - Vercel + MongoDB

## Step 1: Set Up MongoDB Atlas (5 minutes)

1. **Go to**: https://www.mongodb.com/cloud/atlas/register
2. **Sign up** (free - no credit card required)
3. **Create a free cluster**:
   - Click "Build a Database"
   - Choose **FREE** (M0 Sandbox)
   - Select a region close to you
   - Click "Create"

4. **Create Database User**:
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `weble_user` (or any username)
   - Password: Click "Autogenerate Secure Password" and SAVE IT
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Allow Network Access**:
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String**:
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Click "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://weble_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with the password you saved earlier

## Step 2: Deploy to Vercel

### Option A: Through Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com
2. **Sign in** with GitHub
3. **Import your repository**:
   - Click "Add New..." → "Project"
   - Select `weble-uptime-monitor` repository
4. **Configure**:
   - Framework Preset: Vite (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variable**:
   - Click "Environment Variables"
   - Key: `MONGODB_URI`
   - Value: Paste your MongoDB connection string (the one you copied)
   - Make sure to replace `<password>` with your actual password
6. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes
   - Done! 🎉

### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Then add environment variable:
```bash
vercel env add MONGODB_URI
# Paste your MongoDB connection string when prompted
```

Redeploy:
```bash
vercel --prod
```

## Step 3: Verify Deployment

1. Open your Vercel URL (e.g., `your-app.vercel.app`)
2. Enter password: `Weble2024.`
3. Add a test monitor
4. Refresh page - monitor should still be there!
5. Check the Vercel logs for confirmation:
   - Should see: `✅ Connected to MongoDB successfully`

## Common Issues

### Issue: "Server Disconnected"
- **Cause**: MongoDB URI not set or incorrect
- **Fix**: Check Vercel environment variables, make sure MONGODB_URI is set correctly

### Issue: "Failed to connect to MongoDB"
- **Cause**: Wrong password or network access not allowed
- **Fix**: 
  - Verify password in connection string
  - Check MongoDB Network Access allows 0.0.0.0/0

### Issue: Monitors disappear after refresh
- **Cause**: Using in-memory storage (no MongoDB)
- **Fix**: Add MONGODB_URI environment variable to Vercel

## Your Connection String Format

Make sure your MongoDB URI looks like this (all one line):

```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

⚠️ **Important**: 
- Replace `USERNAME` with your MongoDB username
- Replace `PASSWORD` with your MongoDB password
- No spaces in the connection string
- Keep the entire string as one line

## After Deployment

Your app will:
- ✅ Auto-check monitors at your configured interval
- ✅ Store all data permanently in MongoDB
- ✅ Survive server restarts
- ✅ Be accessible from anywhere
- ✅ Check monitors sequentially (one at a time)

Default settings:
- Check interval: 1 hour (3600 seconds)
- Password: `Weble2024.`

Change these in the app after logging in!

