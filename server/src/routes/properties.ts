import { Router } from 'express';
import { collections, getDocs, getDoc, updateDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { PropertyDoc } from '../models/firestore-schemas.js';

export const propertiesRouter = Router();
propertiesRouter.use(authMiddleware);

// GET /api/v1/properties?regionId=london&estateId=oak-park&type=flat&isVoid=true&limit=50
propertiesRouter.get('/', async (req, res, next) => {
  try {
    const { regionId, estateId, blockId, localAuthorityId, type, isVoid, limit: limitStr } = req.query;
    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (regionId) filters.push({ field: 'regionId', op: '==', value: regionId });
    if (estateId) filters.push({ field: 'estateId', op: '==', value: estateId });
    if (blockId) filters.push({ field: 'blockId', op: '==', value: blockId });
    if (localAuthorityId) filters.push({ field: 'localAuthorityId', op: '==', value: localAuthorityId });
    if (type) filters.push({ field: 'type', op: '==', value: type });
    if (isVoid !== undefined) filters.push({ field: 'isVoid', op: '==', value: isVoid === 'true' });

    const limit = limitStr ? parseInt(limitStr as string, 10) : 200;
    const properties = await getDocs<PropertyDoc>(collections.properties, filters, undefined, limit);

    res.json({
      items: properties,
      total: properties.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/properties/:id
propertiesRouter.get('/:id', async (req, res, next) => {
  try {
    const property = await getDoc<PropertyDoc>(collections.properties, req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/properties/:id
propertiesRouter.patch('/:id', async (req, res, next) => {
  try {
    await updateDoc(collections.properties, req.params.id, req.body);
    const updated = await getDoc<PropertyDoc>(collections.properties, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
