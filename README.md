<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Weble Uptime - Website Uptime Monitor

A modern, real-time website uptime monitoring application built with React, TypeScript, and Express.js. Monitor multiple websites simultaneously, track latency, receive alerts, and visualize performance metrics.

## Features

- ✅ **Real-time Monitoring** - Background checks with configurable intervals
- 📊 **Visual Analytics** - Latency charts and performance metrics
- 🔔 **Browser Notifications** - Get alerted when sites go down
- ⏸️ **Pause/Resume** - Control monitoring for individual sites
- 🔄 **Manual Checks** - Trigger immediate status checks
- 📈 **Statistics Dashboard** - Overview of all monitors
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend**: Express.js, Node.js
- **Storage**: JSON file-based persistence
- **Icons**: Lucide React

## Database Setup (Required)

This app uses MongoDB for persistent storage. You need to set up a free MongoDB Atlas database:

1. **Create free MongoDB Atlas account**: https://www.mongodb.com/cloud/atlas/register
2. **Create a free cluster** (M0 Sandbox - FREE forever)
3. **Create database user** with read/write permissions
4. **Add your IP** to Network Access (or allow 0.0.0.0/0 for all IPs)
5. **Get connection string** from "Connect" → "Connect your application"

For detailed instructions, see [SETUP.md](SETUP.md)

## Run Locally

**Prerequisites:** Node.js 18+, npm, MongoDB connection string

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bkapk/weble-uptime-monitor.git
   cd weble-uptime-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   PORT=3001
   ```
   Replace with your actual MongoDB connection string.

4. **Start the backend server** (Terminal 1)
   ```bash
   npm start
   ```
   Backend runs on `http://localhost:3001`

5. **Start the frontend dev server** (Terminal 2)
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

6. **Open your browser**
   Navigate to `http://localhost:3000`
   - Password: `Weble2024.`

## Available Scripts

- `npm run dev` - Start Vite dev server (frontend)
- `npm start` - Start Express server (backend)
- `npm run build` - Build frontend for production
- `npm test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

## Project Structure

```
├── components/          # React components
│   ├── AddMonitorModal.tsx
│   ├── MonitorCard.tsx
│   └── StatsOverview.tsx
├── services/           # API service functions
│   └── monitorService.ts
├── src/test/           # Test setup files
├── App.tsx             # Main React app
├── server.js           # Express backend server
├── types.ts            # TypeScript type definitions
├── constants.ts        # App constants
└── vite.config.ts      # Vite configuration

```

## Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Set up MongoDB Atlas (see Database Setup above)
2. Push your code to GitHub
3. Import project in [Vercel](https://vercel.com)
4. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. **Add environment variables**:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string
6. Deploy!

### Option 2: Deploy to Railway/Render

1. Set up MongoDB Atlas (see Database Setup above)
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. **Add environment variable**:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string
6. Deploy!

### Option 3: Self-hosted

1. Build the frontend: `npm run build`
2. The `dist` folder will be served by Express
3. Deploy `server.js` and `dist` folder to your server
4. Run: `npm start` or use PM2: `pm2 start server.js`

## API Endpoints

- `GET /api/monitors` - Get all monitors
- `POST /api/monitors` - Add new monitors (bulk supported)
- `PATCH /api/monitors/:id/toggle` - Pause/resume monitor
- `DELETE /api/monitors/:id` - Delete monitor
- `POST /api/monitors/:id/check` - Trigger manual check

## Data Persistence

Monitor data is stored in MongoDB Atlas (cloud database). Your data persists permanently and is accessible from anywhere. The database automatically:
- Saves all monitor configurations
- Stores check history (last 30 points)
- Maintains status across server restarts
- Syncs in real-time

## Testing

Run the test suite:
```bash
npm test
```

View test coverage:
```bash
npm run test:coverage
```

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
