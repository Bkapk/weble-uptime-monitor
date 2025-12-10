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
let settingsCollection = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback in-memory storage when MongoDB is not available
let inMemoryMonitors = [];
let inMemorySettings = { globalInterval: 3600 }; // Default 1 hour

// --- Database Connection ---
async function connectDB() {
  // Skip MongoDB if no connection string provided
  if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017') {
    console.log('⚠️  No MongoDB connection string provided.');
    console.log('⚠️  Using IN-MEMORY storage (data will be lost on restart).');
    console.log('📝 To enable persistent storage, set MONGODB_URI environment variable.');
    console.log('📚 See SETUP.md for MongoDB setup instructions.');
    return false;
  }

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
    settingsCollection = db.collection('settings');
    
    // Create indexes for faster lookups
    await monitorsCollection.createIndex({ id: 1 }, { unique: true });
    
    // Initialize settings if not exists
    const settings = await settingsCollection.findOne({ _id: 'global' });
    if (!settings) {
      await settingsCollection.insertOne({ _id: 'global', globalInterval: 3600 });
    }
    
    console.log('✅ Connected to MongoDB successfully');
    console.log('💾 Data will persist permanently');
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.log('⚠️  Falling back to IN-MEMORY storage.');
    console.log('📝 Data will be lost on restart. Set MONGODB_URI to enable persistence.');
    return false;
  }
}

// --- Database Operations ---
async function getAllMonitors() {
  if (!monitorsCollection) {
    return [...inMemoryMonitors];
  }
  try {
    return await monitorsCollection.find({}).toArray();
  } catch (err) {
    console.error('Error fetching monitors:', err);
    return [...inMemoryMonitors];
  }
}

async function saveMonitor(monitor) {
  // Remove _isChecking flag before saving
  const cleanMonitor = { ...monitor };
  delete cleanMonitor._isChecking;
  
  if (!monitorsCollection) {
    const index = inMemoryMonitors.findIndex(m => m.id === cleanMonitor.id);
    if (index >= 0) {
      inMemoryMonitors[index] = cleanMonitor;
    } else {
      inMemoryMonitors.push(cleanMonitor);
    }
    return;
  }
  try {
    await monitorsCollection.updateOne(
      { id: cleanMonitor.id },
      { $set: cleanMonitor },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error saving monitor:', err);
  }
}

async function deleteMonitorById(id) {
  if (!monitorsCollection) {
    inMemoryMonitors = inMemoryMonitors.filter(m => m.id !== id);
    return;
  }
  try {
    await monitorsCollection.deleteOne({ id });
  } catch (err) {
    console.error('Error deleting monitor:', err);
  }
}

async function getSettings() {
  if (!settingsCollection) {
    return inMemorySettings;
  }
  try {
    const settings = await settingsCollection.findOne({ _id: 'global' });
    return settings || { globalInterval: 3600 };
  } catch (err) {
    console.error('Error fetching settings:', err);
    return { globalInterval: 3600 };
  }
}

async function saveSettings(settings) {
  if (!settingsCollection) {
    inMemorySettings = settings;
    return;
  }
  try {
    await settingsCollection.updateOne(
      { _id: 'global' },
      { $set: settings },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error saving settings:', err);
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

// Sequential checking queue
let checkQueue = [];
let isChecking = false;

async function processCheckQueue() {
  if (isChecking || checkQueue.length === 0) return;
  
  isChecking = true;
  
  while (checkQueue.length > 0) {
    const monitorId = checkQueue.shift();
    
    try {
      const monitors = await getAllMonitors();
      const monitor = monitors.find(m => m.id === monitorId);
      
      if (!monitor || monitor.isPaused) continue;
      
      console.log(`🔍 Checking: ${monitor.name}`);
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
      
      await saveMonitor(monitor);
      console.log(`✅ Checked: ${monitor.name} - ${result.status}`);
      
    } catch (err) {
      console.error(`Error processing monitor ${monitorId}:`, err);
    }
    
    // Small delay between checks
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  isChecking = false;
}

// The Heartbeat Loop - Sequential checking
setInterval(async () => {
  try {
    const monitors = await getAllMonitors();
    const settings = await getSettings();
    const now = Date.now();
    const globalIntervalMs = settings.globalInterval * 1000;
    
    for (const monitor of monitors) {
      if (monitor.isPaused) continue;
      
      const lastChecked = monitor.lastChecked || 0;
      
      if (now - lastChecked >= globalIntervalMs) {
        // Add to queue if not already there
        if (!checkQueue.includes(monitor.id)) {
          checkQueue.push(monitor.id);
        }
      }
    }
    
    // Process the queue
    processCheckQueue();
  } catch (err) {
    console.error('Error in heartbeat loop:', err);
  }
}, 5000); // Check every 5 seconds

// --- API Routes ---

app.get('/api/monitors', async (req, res) => {
  try {
    const monitors = await getAllMonitors();
    res.json(monitors);
  } catch (err) {
    console.error('Error in GET /api/monitors:', err);
    res.status(500).json({ error: 'Failed to fetch monitors' });
  }
});

app.post('/api/monitors', async (req, res) => {
  try {
    const { urls } = req.body;
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
        isPaused: false
      };
    });

    for (const monitor of newMonitors) {
      await saveMonitor(monitor);
    }
    
    console.log(`✅ Added ${newMonitors.length} new monitor(s)`);
    res.json(newMonitors);
  } catch (err) {
    console.error('Error in POST /api/monitors:', err);
    res.status(500).json({ error: 'Failed to add monitors' });
  }
});

app.patch('/api/monitors/:id/toggle', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error in PATCH /api/monitors/:id/toggle:', err);
    res.status(500).json({ error: 'Failed to toggle monitor' });
  }
});

app.patch('/api/monitors/:id', async (req, res) => {
  try {
    const monitors = await getAllMonitors();
    const monitor = monitors.find(m => m.id === req.params.id);
    
    if (monitor) {
      const { url } = req.body;
      if (url) {
        let cleanUrl = url;
        if (!/^https?:\/\//i.test(url)) cleanUrl = `https://${url}`;
        monitor.url = cleanUrl;
        monitor.name = cleanUrl.replace(/^https?:\/\//i, '').split('/')[0];
      }
      monitor.status = 'PENDING';
      await saveMonitor(monitor);
      res.json(monitor);
    } else {
      res.status(404).json({ error: 'Monitor not found' });
    }
  } catch (err) {
    console.error('Error in PATCH /api/monitors/:id:', err);
    res.status(500).json({ error: 'Failed to update monitor' });
  }
});

app.delete('/api/monitors/:id', async (req, res) => {
  try {
    await deleteMonitorById(req.params.id);
    console.log(`🗑️  Deleted monitor: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/monitors/:id:', err);
    res.status(500).json({ error: 'Failed to delete monitor' });
  }
});

app.post('/api/monitors/:id/check', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error in POST /api/monitors/:id/check:', err);
    res.status(500).json({ error: 'Failed to check monitor' });
  }
});

// Check all monitors endpoint
app.post('/api/monitors/check-all', async (req, res) => {
  try {
    const monitors = await getAllMonitors();
    const activeMonitors = monitors.filter(m => !m.isPaused);
    
    // Add all to queue
    for (const monitor of activeMonitors) {
      if (!checkQueue.includes(monitor.id)) {
        checkQueue.push(monitor.id);
      }
    }
    
    processCheckQueue();
    
    res.json({ 
      success: true, 
      message: `Checking ${activeMonitors.length} monitor(s)`,
      queued: activeMonitors.length 
    });
  } catch (err) {
    console.error('Error in POST /api/monitors/check-all:', err);
    res.status(500).json({ error: 'Failed to queue checks' });
  }
});

// Settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error('Error in GET /api/settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.patch('/api/settings', async (req, res) => {
  try {
    const { globalInterval } = req.body;
    if (globalInterval !== undefined && globalInterval >= 10) {
      await saveSettings({ globalInterval });
      console.log(`⚙️  Global interval updated to ${globalInterval} seconds`);
      res.json({ success: true, globalInterval });
    } else {
      res.status(400).json({ error: 'Invalid interval (must be >= 10 seconds)' });
    }
  } catch (err) {
    console.error('Error in PATCH /api/settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
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
    console.log(`📊 Background monitoring active (sequential checking)...`);
  });
})();
