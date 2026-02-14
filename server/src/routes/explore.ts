import { Router } from 'express';
import { collections, getDocs, getDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { RegionDoc, LocalAuthorityDoc, EstateDoc, BlockDoc, PropertyDoc } from '../models/firestore-schemas.js';

export const exploreRouter = Router();
exploreRouter.use(authMiddleware);

// GET /api/v1/explore/hierarchy?level=region&parentId=london
exploreRouter.get('/hierarchy', async (req, res, next) => {
  try {
    const { level, parentId } = req.query;

    if (!level) {
      // Top level: return all regions
      const regions = await getDocs<RegionDoc>(collections.regions);
      return res.json({ level: 'country', children: regions });
    }

    switch (level) {
      case 'region': {
        // Return local authorities for a region
        const las = await getDocs<LocalAuthorityDoc>(collections.localAuthorities, [
          { field: 'regionId', op: '==', value: parentId },
        ]);
        return res.json({ level: 'region', parentId, children: las });
      }
      case 'local-authority': {
        const estates = await getDocs<EstateDoc>(collections.estates, [
          { field: 'localAuthorityId', op: '==', value: parentId },
        ]);
        return res.json({ level: 'local-authority', parentId, children: estates });
      }
      case 'estate': {
        const blocks = await getDocs<BlockDoc>(collections.blocks, [
          { field: 'estateId', op: '==', value: parentId },
        ]);
        return res.json({ level: 'estate', parentId, children: blocks });
      }
      case 'block': {
        const properties = await getDocs<PropertyDoc>(collections.properties, [
          { field: 'blockId', op: '==', value: parentId },
        ]);
        return res.json({ level: 'block', parentId, children: properties });
      }
      default:
        return res.status(400).json({ error: `Unknown level: ${level}` });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/explore/regions
exploreRouter.get('/regions', async (_req, res, next) => {
  try {
    const regions = await getDocs<RegionDoc>(collections.regions);
    res.json(regions);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/explore/local-authorities/:id
exploreRouter.get('/local-authorities/:id', async (req, res, next) => {
  try {
    const la = await getDoc<LocalAuthorityDoc>(collections.localAuthorities, req.params.id);
    if (!la) return res.status(404).json({ error: 'Local authority not found' });
    res.json(la);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/explore/estates/:id
exploreRouter.get('/estates/:id', async (req, res, next) => {
  try {
    const estate = await getDoc<EstateDoc>(collections.estates, req.params.id);
    if (!estate) return res.status(404).json({ error: 'Estate not found' });
    res.json(estate);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/explore/blocks/:id
exploreRouter.get('/blocks/:id', async (req, res, next) => {
  try {
    const block = await getDoc<BlockDoc>(collections.blocks, req.params.id);
    if (!block) return res.status(404).json({ error: 'Block not found' });
    res.json(block);
  } catch (err) {
    next(err);
  }
});
