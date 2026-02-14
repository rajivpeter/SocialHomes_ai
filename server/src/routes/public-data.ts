import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const publicDataRouter = Router();
publicDataRouter.use(authMiddleware);

// GET /api/v1/public-data/epc/:postcode
// Proxies the EPC open data API
publicDataRouter.get('/epc/:postcode', async (req, res, next) => {
  try {
    const postcode = req.params.postcode.replace(/\s+/g, '+');
    // EPC open data requires an API key registered at https://epc.opendatacommunities.org/
    const epcApiKey = process.env.EPC_API_KEY;

    if (!epcApiKey) {
      // Return simulated data when no API key available
      return res.json({
        source: 'simulated',
        postcode: req.params.postcode,
        results: [
          { address: '1 Example Road', rating: 'C', sapScore: 68, date: '2023-06-15' },
          { address: '2 Example Road', rating: 'D', sapScore: 55, date: '2022-11-20' },
        ],
      });
    }

    const response = await fetch(`https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${postcode}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${epcApiKey}:`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `EPC API returned ${response.status}` });
    }

    const data = (await response.json()) as { rows?: any[] };
    res.json({ source: 'epc-api', postcode: req.params.postcode, results: data.rows || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public-data/imd/:laCode
// Index of Multiple Deprivation data
publicDataRouter.get('/imd/:laCode', async (req, res, next) => {
  try {
    // IMD data is typically pre-loaded or fetched from ONS Geo Portal
    // For now, return structured simulated data per LA
    const laCode = req.params.laCode;

    res.json({
      source: 'simulated',
      localAuthority: laCode,
      imdDecile: Math.floor(Math.random() * 3) + 1, // 1-3 (deprived)
      incomeDeprivation: Math.round(Math.random() * 30 + 10),
      employmentDeprivation: Math.round(Math.random() * 25 + 8),
      healthDeprivation: Math.round(Math.random() * 20 + 5),
      crimeIndex: Math.round(Math.random() * 40 + 20),
      childPovertyRate: Math.round(Math.random() * 30 + 15),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public-data/weather/:lat/:lng
// Weather data proxy for damp risk calculation
publicDataRouter.get('/weather/:lat/:lng', async (req, res, next) => {
  try {
    const { lat, lng } = req.params;

    // Use Open-Meteo (free, no API key required)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean&timezone=Europe/London&forecast_days=7`
    );

    if (!response.ok) {
      return res.json({
        source: 'simulated',
        forecast: [
          { date: '2026-02-08', tempMax: 8, tempMin: 3, precipitation: 12.5, humidity: 85 },
          { date: '2026-02-09', tempMax: 7, tempMin: 2, precipitation: 8.2, humidity: 82 },
        ],
      });
    }

    const data = await response.json() as { daily?: any };
    res.json({ source: 'open-meteo', location: { lat, lng }, forecast: data.daily });
  } catch (err) {
    next(err);
  }
});
