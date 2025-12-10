<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sentinel Monitor - Website Uptime Monitor

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

## Run Locally

**Prerequisites:** Node.js 18+ and npm

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Weble Uptime Monitor"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server** (Terminal 1)
   ```bash
   npm start
   ```
   Backend runs on `http://localhost:3001`

4. **Start the frontend dev server** (Terminal 2)
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

5. **Open your browser**
   Navigate to `http://localhost:3000`

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

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add environment variables if needed
5. Deploy!

### Option 2: Deploy to Railway/Render

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. The platform will handle the rest

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

Monitor data is stored in `monitors.json` in the project root. This file is automatically created and updated by the server.

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
