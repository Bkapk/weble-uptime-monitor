# 🚀 Simple Migration Guide - No CLI Required!

## ✅ Option 1: Automatic Migration (Easiest - Recommended)

**Good news!** I've updated the code so migrations will run **automatically** the first time you use the app!

1. **Just wait for Vercel to finish deploying** (check your Vercel dashboard)
2. **Visit your website** - migrations will run automatically on the first API call
3. **That's it!** No CLI needed.

## 🌐 Option 2: Web-Based Migration (If Option 1 doesn't work)

If you want to manually trigger migrations, just visit this URL in your browser:

```
https://your-app.vercel.app/api/migrate
```

**Steps:**
1. Replace `your-app` with your actual Vercel app name
2. Open the URL in your browser
3. Click the "Run Migrations" button
4. Wait for it to complete
5. Done! ✅

## 📋 What Happens During Migration?

The migration will create two tables in your PostgreSQL database:
- **Monitor** - Stores all your website monitors
- **Settings** - Stores global settings (like check interval)

## 🔍 How to Check if Migrations Ran Successfully

1. Visit your app: `https://your-app.vercel.app`
2. Try adding a monitor
3. If it works, migrations are complete! ✅

## ❌ Troubleshooting

### If you see errors about tables not existing:

1. **Try Option 2** - Visit `/api/migrate` in your browser
2. **Check Vercel logs** - Go to your Vercel dashboard → Functions → View logs
3. **Verify DATABASE_URL** - Make sure it's set in Vercel environment variables

### If migrations still don't work:

The automatic migration might not work in serverless environments. In that case:
1. Use **Option 2** (web-based migration)
2. Or contact me and I'll help you set it up differently

## 🎉 That's It!

No CLI, no terminal commands, no complicated setup. Just visit your app or the migration URL and you're done!

