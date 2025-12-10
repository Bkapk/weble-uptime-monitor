# Weble Uptime Monitor - PostgreSQL & Prisma Setup Guide

This guide will help you set up PostgreSQL with Prisma for the Weble Uptime Monitor application.

## Prerequisites

- Node.js installed (v18 or higher)
- A PostgreSQL database (local or cloud-hosted)
- npm or yarn package manager

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `@prisma/client` - Prisma Client for database operations
- `prisma` - Prisma CLI (dev dependency)

## Step 2: Set Up PostgreSQL Database

### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:
   ```bash
   createdb weble_uptime
   ```
3. Or using psql:
   ```sql
   CREATE DATABASE weble_uptime;
   ```

### Option B: Cloud PostgreSQL (Recommended for Vercel)

Popular options:
- **Neon** (https://neon.tech) - Free tier, serverless PostgreSQL
- **Supabase** (https://supabase.com) - Free tier PostgreSQL
- **Railway** (https://railway.app) - Easy PostgreSQL hosting
- **Vercel Postgres** (https://vercel.com/storage/postgres) - Integrated with Vercel

#### Example: Setting up Neon (Free)

1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the connection string (it will look like):
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

## Step 3: Configure Environment Variables

### Local Development

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/weble_uptime?schema=public"
```

Replace:
- `username` - Your PostgreSQL username
- `password` - Your PostgreSQL password
- `localhost:5432` - Your PostgreSQL host and port
- `weble_uptime` - Your database name

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
   - **Environment**: Production, Preview, Development (select all)

## Step 4: Run Prisma Migrations

Generate Prisma Client and create database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables (run migrations)
npx prisma migrate dev --name init
```

This will:
- Create the `Monitor` and `Settings` tables in your database
- Generate the Prisma Client for use in your application

### For Production/Vercel

If you're deploying to Vercel, you can run migrations in two ways:

**Option 1: Run migrations manually before deployment**
```bash
npx prisma migrate deploy
```

**Option 2: Add to Vercel build command**

Update your `package.json`:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && npm run build"
  }
}
```

Or use Vercel's Post Deploy Hook to run migrations automatically.

## Step 5: Verify Setup

### Check Database Connection

You can verify your connection using Prisma Studio:

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 where you can view and edit your database.

### Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The application should connect to your PostgreSQL database automatically.

## Step 6: Deploy to Vercel

1. **Push your code to GitHub** (if not already done)

2. **In Vercel Dashboard**:
   - Go to your project settings
   - Add `DATABASE_URL` environment variable
   - Redeploy your application

3. **Run migrations on Vercel**:
   - You can use Vercel's CLI:
     ```bash
     vercel env pull .env.local
     npx prisma migrate deploy
     ```
   - Or add a Post Deploy Hook in Vercel settings

## Troubleshooting

### Connection Issues

If you're getting connection errors:

1. **Check your DATABASE_URL format**:
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

2. **For cloud databases, ensure**:
   - SSL is enabled (`?sslmode=require`)
   - Your IP is whitelisted (if required)
   - The database is accessible from the internet

3. **Check Prisma logs**:
   ```bash
   npx prisma migrate dev --name test
   ```

### Vercel Deployment Issues

1. **Ensure `prisma generate` runs during build**:
   - Check that `postinstall` script is in `package.json`
   - Or add `prisma generate` to `vercel-build` script

2. **Check Vercel build logs** for Prisma errors

3. **Verify environment variables** are set correctly in Vercel dashboard

## Database Schema

The application uses two main tables:

### Monitor
- `id` (UUID, primary key)
- `url` (String)
- `name` (String)
- `status` (String, default: "PENDING")
- `statusCode` (Int, nullable)
- `lastChecked` (DateTime, nullable)
- `latency` (Int, nullable)
- `history` (JSON array)
- `isPaused` (Boolean, default: false)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Settings
- `id` (String, primary key, default: "global")
- `globalInterval` (Int, default: 3600)
- `updatedAt` (DateTime)

## Next Steps

Once set up, your application will:
- Store monitors in PostgreSQL
- Persist settings across deployments
- Work seamlessly with Vercel serverless functions

For questions or issues, check the Prisma documentation: https://www.prisma.io/docs

