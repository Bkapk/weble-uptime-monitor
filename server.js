const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_HISTORY = 30;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'weble_uptime';
let db = null;
let monitorsCollection = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- Database Connection ---
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    
    await client.connect();
    db = client.db(DB_NAME);
    monitorsCollection = db.collection('monitors');
    
    // Create index for faster lookups
    await monitorsCollection.createIndex({ id: 1 }, { unique: true });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.log('⚠️  Running without persistent storage. Data will be lost on restart.');
    return false;
  }
}

// --- Database Operations ---
async function getAllMonitors() {
  if (!monitorsCollection) return [];
  try {
    return await monitorsCollection.find({}).toArray();
  } catch (err) {
    console.error('Error fetching monitors:', err);
    return [];
  }
}

async function saveMonitor(monitor) {
  if (!monitorsCollection) return;
  try {
    await monitorsCollection.updateOne(
      { id: monitor.id },
      { $set: monitor },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error saving monitor:', err);
  }
}

async function deleteMonitorById(id) {
  if (!monitorsCollection) return;
  try {
    await monitorsCollection.deleteOne({ id });
  } catch (err) {
    console.error('Error deleting monitor:', err);
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
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(monitor.url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: { 'User-Agent': 'WebleUptime/1.0' }
    });
    
    clearTimeout(timeoutId);
    const end = performance.now();
    const latency = Math.round(end - start);

    const isUp = response.ok || (response.status >= 200 && response.status < 400); 
    
    if (monitor.status === 'UP' && !isUp) {
      sendAlert(monitor, response.status);
    }

    return {
      status: isUp ? 'UP' : 'DOWN',
      statusCode: response.status,
      latency: latency
    };
  } catch (error) {
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
setInterval(async () => {
  const monitors = await getAllMonitors();
  const now = Date.now();
  
  for (const monitor of monitors) {
    if (monitor.isPaused) continue;
    if (monitor._isChecking) continue;

    const lastChecked = monitor.lastChecked || 0;
    const intervalMs = monitor.interval * 1000;

    if (now - lastChecked >= intervalMs) {
      monitor._isChecking = true;
      
      try {
        const result = await checkMonitor(monitor);
        monitor.status = result.status;
        monitor.statusCode = result.statusCode;
        monitor.latency = result.latency;
        monitor.lastChecked = Date.now();
        
        if (!monitor.history) monitor.history = [];
        monitor.history.push({ timestamp: Date.now(), latency: result.latency });
        if (monitor.history.length > MAX_HISTORY) {
          monitor.history.shift();
        }

        delete monitor._isChecking;
        await saveMonitor(monitor);
      } catch (err) {
        console.error(`Error checking ${monitor.name}:`, err);
        delete monitor._isChecking;
      }
    }
  }
}, 1000);

// --- API Routes ---

app.get('/api/monitors', async (req, res) => {
  const monitors = await getAllMonitors();
  res.json(monitors);
});

app.post('/api/monitors', async (req, res) => {
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
      interval: interval || 3600,
      isPaused: false
    };
  });

  for (const monitor of newMonitors) {
    await saveMonitor(monitor);
  }
  
  res.json(newMonitors);
});

app.patch('/api/monitors/:id/toggle', async (req, res) => {
  const monitors = await getAllMonitors();
  const monitor = monitors.find(m => m.id === req.params.id);
  
  if (monitor) {
    monitor.isPaused = !monitor.isPaused;
    monitor.status = monitor.isPaused ? 'PAUSED' : 'PENDING';
    await saveMonitor(monitor);
    res.json(monitor);
  } else {
    res.status(404).json({ error: 'Monitor not found' });
  }
});

app.patch('/api/monitors/:id', async (req, res) => {
  const monitors = await getAllMonitors();
  const monitor = monitors.find(m => m.id === req.params.id);
  
  if (monitor) {
    const { url, interval } = req.body;
    if (url) {
      let cleanUrl = url;
      if (!/^https?:\/\//i.test(url)) cleanUrl = `https://${url}`;
      monitor.url = cleanUrl;
      monitor.name = cleanUrl.replace(/^https?:\/\//i, '').split('/')[0];
    }
    if (interval !== undefined) {
      monitor.interval = interval;
    }
    monitor.status = 'PENDING';
    await saveMonitor(monitor);
    res.json(monitor);
  } else {
    res.status(404).json({ error: 'Monitor not found' });
  }
});

app.delete('/api/monitors/:id', async (req, res) => {
  await deleteMonitorById(req.params.id);
  res.json({ success: true });
});

app.post('/api/monitors/:id/check', async (req, res) => {
  const monitors = await getAllMonitors();
  const monitor = monitors.find(m => m.id === req.params.id);
  
  if (monitor) {
    const result = await checkMonitor(monitor);
    monitor.status = result.status;
    monitor.statusCode = result.statusCode;
    monitor.latency = result.latency;
    monitor.lastChecked = Date.now();
    
    if (!monitor.history) monitor.history = [];
    monitor.history.push({ timestamp: Date.now(), latency: result.latency });
    if (monitor.history.length > MAX_HISTORY) monitor.history.shift();
    
    await saveMonitor(monitor);
    res.json(monitor);
  } else {
    res.status(404).json({ error: 'Monitor not found' });
  }
});

// --- Catch-All Route ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Weble Uptime Backend running on port ${PORT}`);
    console.log(`📊 Background monitoring active...`);
  });
})();
