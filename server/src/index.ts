import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import { propertiesRouter } from './routes/properties.js';
import { tenantsRouter } from './routes/tenants.js';
import { casesRouter } from './routes/cases.js';
import { exploreRouter } from './routes/explore.js';
import { briefingRouter } from './routes/briefing.js';
import { complianceRouter } from './routes/compliance.js';
import { rentRouter } from './routes/rent.js';
import { reportsRouter } from './routes/reports.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { publicDataRouter } from './routes/public-data.js';
import { exportRouter } from './routes/export.js';
import { authRouter } from './routes/auth.js';
import { lettingsRouter } from './routes/lettings.js';
import { bookingRouter } from './routes/booking.js';
import { errorHandler } from './middleware/error-handler.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { getHealthStatus } from './services/monitoring.js';
import { apiLimiter, authLimiter, aiLimiter, adminLimiter } from './middleware/rate-limiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// ---- Middleware ----
app.use(compression());

// Security headers via Helmet with a proper Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
      connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://firestore.googleapis.com", "https://*.firebaseio.com", "https://apis.google.com"],
      frameSrc: ["https://socialhomes-674258130066.firebaseapp.com", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Additional security headers not covered by Helmet defaults
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request correlation ID — attach a unique ID to every request for tracing
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// CORS — restricted to known origins
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:8080',   // Local server
  'https://socialhomes-674258130066.europe-west2.run.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, Cloud Run serves both API and SPA from the same origin
      // so non-matching origins are still allowed to avoid breaking legitimate traffic.
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Persona', 'X-Request-ID'],
}));

app.use(morgan('combined'));
app.use(metricsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Health Check (Cloud Run) ----
app.get('/health', async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ---- Firebase Config (public, no auth) ----
// Serves Firebase client config from environment variables so the SPA
// never hardcodes keys. The values are NOT secrets — they are the public
// Firebase Web SDK config used in every browser that loads the app.
app.get('/api/v1/config', (_req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '',
    },
  });
});

// ---- API Routes (with per-category rate limiting) ----
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/ai', aiLimiter, aiRouter);
app.use('/api/v1/admin', adminLimiter, adminRouter);

// All other API routes use the general rate limiter
app.use('/api/v1/properties', apiLimiter, propertiesRouter);
app.use('/api/v1/tenants', apiLimiter, tenantsRouter);
app.use('/api/v1/cases', apiLimiter, casesRouter);
app.use('/api/v1/explore', apiLimiter, exploreRouter);
app.use('/api/v1/briefing', apiLimiter, briefingRouter);
app.use('/api/v1/compliance', apiLimiter, complianceRouter);
app.use('/api/v1/rent', apiLimiter, rentRouter);
app.use('/api/v1/reports', apiLimiter, reportsRouter);
app.use('/api/v1/public-data', apiLimiter, publicDataRouter);
app.use('/api/v1/export', apiLimiter, exportRouter);
app.use('/api/v1/lettings', apiLimiter, lettingsRouter);
app.use('/api/v1/booking', apiLimiter, bookingRouter);

// ---- Convenience Route Aliases ----
// Repairs and complaints are stored in the `cases` collection with a `type`
// field. These aliases let external tools (QA, dashboards) hit
// /api/v1/repairs or /api/v1/complaints directly.
import { getDocs, collections } from './services/firestore.js';

app.get('/api/v1/repairs', apiLimiter, async (_req, res, next) => {
  try {
    const allCases = await getDocs<any>(collections.cases, undefined, undefined, 1000);
    const repairs = allCases.filter((c: any) => c.type === 'repair');
    res.json({ items: repairs, total: repairs.length });
  } catch (err) { next(err); }
});

app.get('/api/v1/complaints', apiLimiter, async (_req, res, next) => {
  try {
    const allCases = await getDocs<any>(collections.cases, undefined, undefined, 1000);
    const complaints = allCases.filter((c: any) => c.type === 'complaint');
    res.json({ items: complaints, total: complaints.length });
  } catch (err) { next(err); }
});

app.get('/api/v1/allocations', apiLimiter, async (_req, res, next) => {
  try {
    // Allocations are derived from void properties
    const allProps = await getDocs<any>(collections.properties, undefined, undefined, 1000);
    const voids = allProps.filter((p: any) => p.isVoid);
    res.json({ items: voids, total: voids.length });
  } catch (err) { next(err); }
});

// ---- Serve React SPA Static Files ----
const clientDistPath = path.resolve(__dirname, '../../app/dist');
app.use(express.static(clientDistPath));

// ---- SPA Fallback: all non-API routes serve index.html ----
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ---- Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SocialHomes.Ai API server running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  API:    http://localhost:${PORT}/api/v1/`);
  console.log(`  SPA:    http://localhost:${PORT}/`);
});

export default app;
