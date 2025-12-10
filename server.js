const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
// Cloud providers often inject the PORT via environment variables. Fallback to 3001 for local dev.
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'monitors.json');
const MAX_HISTORY = 30;

// Middleware
app.use(cors());
app.use(express.json());

// --- Static File Serving ---
// Serve the 'dist' directory (standard build output for Vite/React)
// This allows the Node server to serve the frontend app directly.
app.use(express.static(path.join(__dirname, 'dist')));

// In-memory state
let monitors = [];

// --- Persistence ---
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      monitors = JSON.parse(data);
      console.log(`Loaded ${monitors.length} monitors from disk.`);
    }
  } catch (err) {
    console.error('Failed to load data:', err);
    monitors = [];
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(monitors, null, 2));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
}

// --- Notifications ---
function sendAlert(monitor, statusCode) {
  const timestamp = new Date().toISOString();
  console.log(`\n[ALERT] 🚨 ${monitor.name} is DOWN! Status: ${statusCode} | Time: ${timestamp}`);
}

// --- Background Worker ---
async function checkMonitor(monitor) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(monitor.url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: { 'User-Agent': 'SentinelMonitor/1.0' }
    });
    
    clearTimeout(timeoutId);
    const end = performance.now();
    const latency = Math.round(end - start);

    const isUp = response.ok || (response.status >= 200 && response.status < 400); 
    
    // Status Transition Check
    if (monitor.status === 'UP' && !isUp) {
      sendAlert(monitor, response.status);
    }

    return {
      status: isUp ? 'UP' : 'DOWN',
      statusCode: response.status,
      latency: latency
    };
  } catch (error) {
    // Network errors (DNS, Connection Refused)
    if (monitor.status === 'UP') {
      sendAlert(monitor, 'Network Error');
    }
    return {
      status: 'DOWN',
      statusCode: 0,
      latency: 0
    };
  }
}

// The Heartbeat Loop
setInterval(() => {
  const now = Date.now();
  
  monitors.forEach(monitor => {
    if (monitor.isPaused) return;
    if (monitor._isChecking) return;

    const lastChecked = monitor.lastChecked || 0;
    const intervalMs = monitor.interval * 1000;

    if (now - lastChecked >= intervalMs) {
      monitor._isChecking = true;
      
      checkMonitor(monitor).then(result => {
        monitor.status = result.status;
        monitor.statusCode = result.statusCode;
        monitor.latency = result.latency;
        monitor.lastChecked = Date.now();
        
        monitor.history.push({ timestamp: Date.now(), latency: result.latency });
        if (monitor.history.length > MAX_HISTORY) {
          monitor.history.shift();
        }

        monitor._isChecking = false;
        saveData();
      }).catch(err => {
        console.error(`Error checking ${monitor.name}:`, err);
        monitor._isChecking = false;
      });
    }
  });
}, 1000);

// --- API Routes ---

app.get('/api/monitors', (req, res) => {
  res.json(monitors);
});

app.post('/api/monitors', (req, res) => {
  const { urls, interval } = req.body;
  if (!urls) return res.status(400).json({ error: 'URLs required' });

  const urlList = urls.split('\n').map(l => l.trim()).filter(l => l);
  
  const newMonitors = urlList.map(url => {
    let cleanUrl = url;
    if (!/^https?:\/\//i.test(url)) cleanUrl = `https://${url}`;
    
    let name = cleanUrl.replace(/^https?:\/\//i, '').split('/')[0];

    return {
      id: crypto.randomUUID(),
      url: cleanUrl,
      name: name,
      status: 'PENDING',
      statusCode: null,
      lastChecked: null,
      latency: null,
      history: [],
      interval: interval || 60,
      isPaused: false
    };
  });

  monitors.push(...newMonitors);
  saveData();
  res.json(newMonitors);
});

app.patch('/api/monitors/:id/toggle', (req, res) => {
  const monitor = monitors.find(m => m.id === req.params.id);
  if (monitor) {
    monitor.isPaused = !monitor.isPaused;
    monitor.status = monitor.isPaused ? 'PAUSED' : 'PENDING';
    saveData();
    res.json(monitor);
  } else {
    res.status(404).json({ error: 'Monitor not found' });
  }
});

app.delete('/api/monitors/:id', (req, res) => {
  monitors = monitors.filter(m => m.id !== req.params.id);
  saveData();
  res.json({ success: true });
});

app.post('/api/monitors/:id/check', async (req, res) => {
  const monitor = monitors.find(m => m.id === req.params.id);
  if (monitor) {
    const result = await checkMonitor(monitor);
    monitor.status = result.status;
    monitor.statusCode = result.statusCode;
    monitor.latency = result.latency;
    monitor.lastChecked = Date.now();
    monitor.history.push({ timestamp: Date.now(), latency: result.latency });
    if (monitor.history.length > MAX_HISTORY) monitor.history.shift();
    saveData();
    res.json(monitor);
  } else {
    res.status(404).json({ error: 'Monitor not found' });
  }
});

// --- Catch-All Route ---
// For any request that isn't an API route, serve the index.html.
// This supports client-side routing if you add it later.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
loadData();
app.listen(PORT, () => {
  console.log(`Sentinel Backend running on port ${PORT}`);
  console.log(`Background monitoring active...`);
});