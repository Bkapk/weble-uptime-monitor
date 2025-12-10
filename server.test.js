import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We'll test the server logic by creating a test server instance
describe('Weble Uptime API', () => {
  let app;
  let testDataFile;
  let monitors;

  beforeEach(() => {
    // Create a temporary data file for testing
    testDataFile = path.join(__dirname, 'test-monitors.json');
    
    // Reset monitors array
    monitors = [];
    
    // Create Express app with same logic as server.js
    app = express();
    app.use(cors());
    app.use(express.json());

    // API Routes
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
      res.json(newMonitors);
    });

    app.patch('/api/monitors/:id/toggle', (req, res) => {
      const monitor = monitors.find(m => m.id === req.params.id);
      if (monitor) {
        monitor.isPaused = !monitor.isPaused;
        monitor.status = monitor.isPaused ? 'PAUSED' : 'PENDING';
        res.json(monitor);
      } else {
        res.status(404).json({ error: 'Monitor not found' });
      }
    });

    app.delete('/api/monitors/:id', (req, res) => {
      const index = monitors.findIndex(m => m.id === req.params.id);
      if (index !== -1) {
        monitors.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Monitor not found' });
      }
    });
  });

  afterEach(() => {
    // Clean up test data file if it exists
    if (fs.existsSync(testDataFile)) {
      fs.unlinkSync(testDataFile);
    }
  });

  describe('GET /api/monitors', () => {
    it('should return empty array when no monitors exist', async () => {
      const res = await request(app).get('/api/monitors');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all monitors', async () => {
      monitors.push({
        id: 'test-1',
        url: 'https://example.com',
        name: 'example.com',
        status: 'UP',
        interval: 60,
        isPaused: false
      });

      const res = await request(app).get('/api/monitors');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe('test-1');
    });
  });

  describe('POST /api/monitors', () => {
    it('should create a single monitor', async () => {
      const res = await request(app)
        .post('/api/monitors')
        .send({ urls: 'https://example.com', interval: 60 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].url).toBe('https://example.com');
      expect(res.body[0].name).toBe('example.com');
      expect(res.body[0].status).toBe('PENDING');
      expect(res.body[0].interval).toBe(60);
    });

    it('should create multiple monitors from newline-separated URLs', async () => {
      const res = await request(app)
        .post('/api/monitors')
        .send({ 
          urls: 'https://example.com\nhttps://google.com\nexample.org',
          interval: 120 
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[0].url).toBe('https://example.com');
      expect(res.body[1].url).toBe('https://google.com');
      expect(res.body[2].url).toBe('https://example.org');
      expect(res.body[0].interval).toBe(120);
    });

    it('should add https:// prefix if missing', async () => {
      const res = await request(app)
        .post('/api/monitors')
        .send({ urls: 'example.com' });

      expect(res.status).toBe(200);
      expect(res.body[0].url).toBe('https://example.com');
    });

    it('should return 400 if URLs are missing', async () => {
      const res = await request(app)
        .post('/api/monitors')
        .send({ interval: 60 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('URLs required');
    });

    it('should use default interval of 60 if not provided', async () => {
      const res = await request(app)
        .post('/api/monitors')
        .send({ urls: 'https://example.com' });

      expect(res.status).toBe(200);
      expect(res.body[0].interval).toBe(60);
    });
  });

  describe('PATCH /api/monitors/:id/toggle', () => {
    it('should toggle monitor pause status', async () => {
      const monitor = {
        id: 'test-1',
        url: 'https://example.com',
        name: 'example.com',
        status: 'UP',
        interval: 60,
        isPaused: false
      };
      monitors.push(monitor);

      const res = await request(app).patch('/api/monitors/test-1/toggle');
      
      expect(res.status).toBe(200);
      expect(res.body.isPaused).toBe(true);
      expect(res.body.status).toBe('PAUSED');
    });

    it('should return 404 for non-existent monitor', async () => {
      const res = await request(app).patch('/api/monitors/non-existent/toggle');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Monitor not found');
    });
  });

  describe('DELETE /api/monitors/:id', () => {
    it('should delete a monitor', async () => {
      monitors.push({
        id: 'test-1',
        url: 'https://example.com',
        name: 'example.com',
        status: 'UP',
        interval: 60,
        isPaused: false
      });

      const res = await request(app).delete('/api/monitors/test-1');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(monitors).toHaveLength(0);
    });

    it('should return 404 for non-existent monitor', async () => {
      const res = await request(app).delete('/api/monitors/non-existent');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Monitor not found');
    });
  });
});

