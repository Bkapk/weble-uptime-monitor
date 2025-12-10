# 🚀 Super Simple Database Setup - No CLI Needed!

## The Problem
Vercel's serverless environment doesn't allow running `prisma migrate deploy` directly. But don't worry - there's a simple solution!

## ✅ Solution: Use Prisma DB Push (One-Time Setup)

Since you're using Vercel's integrated Prisma Postgres, the easiest way is to push the schema directly. Here are your options:

### Option 1: Use Vercel's Database Tab (Easiest!)

1. Go to your **Vercel Dashboard**
2. Click on your project
3. Go to the **Storage** tab (or **Database** tab)
4. Find your **Prisma Postgres** database
5. Click on it
6. Look for a **"Schema"** or **"Migrations"** section
7. Vercel might have a button to **"Push Schema"** or **"Run Migrations"**

### Option 2: One-Time Local Setup (5 minutes)

If Option 1 doesn't work, do this **once** on your computer:

1. **Install Vercel CLI** (one-time):
   ```bash
   npm install -g vercel
   ```

2. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```
   (This creates a `.env.local` file with your database connection)

3. **Push the database schema**:
   ```bash
   npx prisma db push
   ```

4. **That's it!** Your database is now set up.

### Option 3: Manual SQL (If you have database access)

If you have direct access to your PostgreSQL database, you can run this SQL:

```sql
-- Create Monitor table
CREATE TABLE IF NOT EXISTS "Monitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusCode" INTEGER,
    "lastChecked" TIMESTAMP(3),
    "latency" INTEGER,
    "history" JSONB NOT NULL DEFAULT '[]',
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "Monitor_isPaused_idx" ON "Monitor"("isPaused");

-- Create Settings table
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "globalInterval" INTEGER NOT NULL DEFAULT 3600,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Insert default settings
INSERT INTO "Settings" ("id", "globalInterval", "updatedAt")
VALUES ('global', 3600, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
```

## 🎯 Recommended: Option 2 (One-Time Local Setup)

This is the most reliable method. You only need to do it **once**, and then your database will be set up forever.

**Steps:**
1. Open PowerShell or Terminal on your computer
2. Navigate to your project folder:
   ```bash
   cd "D:\DESIGNS NEW\Weble Uptime Monitor"
   ```
3. Run these commands:
   ```bash
   npm install -g vercel
   vercel env pull .env.local
   npx prisma db push
   ```

That's it! Your database will be set up and ready to use.

## ✅ Verify It Worked

After setup, visit your app and try adding a monitor. If it works, you're all set! 🎉

## Need Help?

If you get stuck, let me know what error message you see and I'll help you fix it!

