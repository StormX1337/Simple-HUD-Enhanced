import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './db.js';
import { seedBots } from './seed.js';
import { api } from './routes/api.js';
import { GameError } from './game/slot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Baut die Express-Anwendung auf. Wird vom Server und von den Tests
 * benutzt, damit beide exakt dieselben Routen sehen.
 */
export function createApp(options: { serveClient?: boolean; quiet?: boolean } = {}): Express {
  const { serveClient = true, quiet = false } = options;

  migrate();
  const created = seedBots();
  if (created > 0 && !quiet) console.log(`[bandit-bay] ${created} Mitspieler-Bots angelegt`);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }));
  app.use('/api', api);

  // Im Produktionsbetrieb wird der gebaute Client mit ausgeliefert.
  const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
  if (serveClient && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof GameError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('[bandit-bay] Unerwarteter Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}
