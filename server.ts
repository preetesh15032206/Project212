import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;

// Setup Database Connections
const DB_PATH = path.join(process.cwd(), 'pipeline.db');
const db = new Database(DB_PATH);

// Initialize DB schema to mirror your pipeline for testing locally
db.exec(`
  CREATE TABLE IF NOT EXISTS predictions (
    timestamp TEXT PRIMARY KEY,
    actual_temp REAL,
    predicted_temp REAL
  );
  CREATE TABLE IF NOT EXISTS eval_log (
    run_at TEXT PRIMARY KEY,
    mae REAL,
    rmse REAL,
    n_samples INTEGER
  );
`);

// Seed dummy data if DB is completely empty (helps preview loading on initial start)
const countPred = db.prepare('SELECT COUNT(*) as c FROM predictions').get() as { c: number };
if (countPred.c === 0) {
  const insertPred = db.prepare('INSERT INTO predictions (timestamp, actual_temp, predicted_temp) VALUES (?, ?, ?)');
  const insertEval = db.prepare('INSERT INTO eval_log (run_at, mae, rmse, n_samples) VALUES (?, ?, ?, ?)');
  
  const now = new Date();
  
  // Seed eval log
  for(let i=0; i<20; i++) {
    const runTime = new Date(now.getTime() - i * 6 * 60 * 60 * 1000);
    const maeBase = 1.2 + (Math.random() * 0.5 - 0.2);
    const rmseBase = maeBase + 0.5 + (Math.random() * 0.3);
    insertEval.run(runTime.toISOString(), maeBase, rmseBase, 15400 + Math.floor(Math.random() * 500));
  }
  
  // Seed predictions
  const baseTemp = 25;
  for (let i = 48; i >= -12; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourOfDay = time.getHours();
    const cycle = Math.sin((hourOfDay - 8) * (Math.PI / 12)); 
    const actualNoise = (Math.random() - 0.5) * 3;
    const predictNoise = (Math.random() - 0.5) * 2;
    const actual = baseTemp + cycle * 8 + actualNoise;
    const predicted = baseTemp + cycle * 8 + predictNoise;
    
    insertPred.run(
      time.toISOString(),
      i < 0 ? null : parseFloat(actual.toFixed(1)),
      parseFloat(predicted.toFixed(1))
    );
  }
}

async function startServer() {
  
  /**
   * Translating your Flask /api/data endpoint to Express
   */
  app.get('/api/data', (req, res) => {
    const rows = db.prepare(`
      SELECT timestamp, actual_temp, predicted_temp
      FROM predictions
      ORDER BY timestamp DESC
      LIMIT 48
    `).all();
    
    // Reverse to chronological order for charts (same as predictions.reverse() in Python)
    res.json(rows.reverse());
  });

  /**
   * API translated from your /metrics route -> /api/metrics for React consumption
   */
  app.get('/api/metrics', (req, res) => {
    const rows = db.prepare(`
      SELECT run_at, mae, rmse, n_samples
      FROM eval_log
      ORDER BY run_at DESC
      LIMIT 20
    `).all();
    
    res.json(rows);
  });

  /**
   * Latest metric for the top KPIs
   */
  app.get('/api/latest_metric', (req, res) => {
    const row = db.prepare(`
      SELECT run_at, mae, rmse, n_samples
      FROM eval_log
      ORDER BY run_at DESC
      LIMIT 1
    `).get();
    
    res.json(row || null);
  });

  // Vite middleware for development (serves the React App via Express)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
