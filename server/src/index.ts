import express from 'express';
import cors from 'cors';
import path from 'path';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Mount your routers
import authRouter from './routes/auth';

const app = express();

// Hide tech fingerprint & add standard security headers
app.disable('x-powered-by');
app.use(
  helmet({
    // Disable CSP by default to avoid blocking your SPA assets; tune later if needed.
    contentSecurityPolicy: false,
  })
);

// Request logging (dev-friendly locally, combined in prod)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Tighten body size to avoid accidental DoS
app.use(express.json({ limit: '1mb' }));

// CORS: same-origin is fine; if you split hosts, set ALLOWED_ORIGIN in .env
const allowed = process.env.ALLOWED_ORIGIN;
app.use(allowed ? cors({ origin: allowed, credentials: true }) : cors());

// Basic rate limiting (IP-based) for all routes
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests / 15min per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- API routes ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);

// --- Serve the built client (client/dist) ---
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Express v5-safe SPA fallback: any non-API/ auth GET -> index.html
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API + SPA on http://localhost:${port}`));
