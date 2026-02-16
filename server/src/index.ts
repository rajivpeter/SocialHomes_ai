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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// ---- Middleware ----
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React SPA
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Health Check (Cloud Run) ----
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'socialhomes-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
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

// ---- API Routes ----
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertiesRouter);
app.use('/api/v1/tenants', tenantsRouter);
app.use('/api/v1/cases', casesRouter);
app.use('/api/v1/explore', exploreRouter);
app.use('/api/v1/briefing', briefingRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/rent', rentRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/public-data', publicDataRouter);
app.use('/api/v1/export', exportRouter);
app.use('/api/v1/lettings', lettingsRouter);
app.use('/api/v1/booking', bookingRouter);

// ---- Convenience Route Aliases ----
// Repairs and complaints are stored in the `cases` collection with a `type`
// field. These aliases let external tools (QA, dashboards) hit
// /api/v1/repairs or /api/v1/complaints directly.
import { getDocs, collections } from './services/firestore.js';

app.get('/api/v1/repairs', async (_req, res, next) => {
  try {
    const allCases = await getDocs<any>(collections.cases, undefined, undefined, 1000);
    const repairs = allCases.filter((c: any) => c.type === 'repair');
    res.json({ items: repairs, total: repairs.length });
  } catch (err) { next(err); }
});

app.get('/api/v1/complaints', async (_req, res, next) => {
  try {
    const allCases = await getDocs<any>(collections.cases, undefined, undefined, 1000);
    const complaints = allCases.filter((c: any) => c.type === 'complaint');
    res.json({ items: complaints, total: complaints.length });
  } catch (err) { next(err); }
});

app.get('/api/v1/allocations', async (_req, res, next) => {
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
  console.log(`✅ SocialHomes.Ai API server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API:    http://localhost:${PORT}/api/v1/`);
  console.log(`   SPA:    http://localhost:${PORT}/`);
});

export default app;
