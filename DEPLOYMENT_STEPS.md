# Deployment Steps for Vercel with Prisma Postgres

## ✅ Step 1: Database Setup (COMPLETED)

You've already set up the Prisma Postgres database via Vercel wizard. The following environment variables were automatically added:
- `POSTGRES_URL`
- `PRISMA_DATABASE_URL`
- `DATABASE_URL` ← Prisma uses this one

## 📋 Step 2: Run Database Migrations

You need to run migrations **once** to create the database tables. Choose one method:

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Option B: Using Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Deploy Hooks**
3. Create a new deploy hook (optional - for automatic migrations)

### Option C: Using API Endpoint (After First Deployment)

After your first deployment, you can trigger migrations via API:

```bash
curl -X POST https://your-app.vercel.app/api/migrate
```

**Note**: This endpoint is open by default. You may want to add authentication.

## 🚀 Step 3: Deploy to Vercel

1. **Push your code** (if not already done):
   ```bash
   git push origin main
   ```

2. **Vercel will automatically**:
   - Detect the new commit
   - Run `prisma generate` during build (via `buildCommand` in `vercel.json`)
   - Build your frontend
   - Deploy everything

3. **Check the deployment logs** in Vercel dashboard to ensure:
   - ✅ Prisma Client is generated successfully
   - ✅ Build completes without errors

## ✅ Step 4: Verify Everything Works

1. Visit your deployed site
2. Try adding a monitor
3. Check Vercel function logs for any database errors

## 🔍 Troubleshooting

### If migrations fail:

1. **Check Vercel logs** for Prisma errors
2. **Verify DATABASE_URL** is set correctly in Vercel environment variables
3. **Run migrations manually** using Option A above

### If you see "Prisma Client not generated":

- The `buildCommand` in `vercel.json` should include `prisma generate`
- Check that `prisma` is in your `devDependencies` in `package.json`

### If database connection fails:

- Verify all three environment variables are set in Vercel
- Check that the database is accessible (not paused/sleeping)
- For Neon/Supabase: Ensure the database is active

## 📝 Next Steps

Once deployed and migrations are run:
- ✅ Your app will use PostgreSQL instead of MongoDB
- ✅ All monitors will persist in the database
- ✅ Settings will be saved across deployments

## 🎉 You're Done!

Your Weble Uptime Monitor is now running on Vercel with PostgreSQL!

