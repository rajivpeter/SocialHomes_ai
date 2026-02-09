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
