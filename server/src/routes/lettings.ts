import { Router } from 'express';
import { collections, getDocs, getDoc, addDoc, updateDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';

export const lettingsRouter = Router();
lettingsRouter.use(authMiddleware);

// GET /api/v1/lettings/viewings — list all viewings
lettingsRouter.get('/viewings', async (_req, res, next) => {
  try {
    const viewings = await getDocs<any>(collections.viewings, undefined, { field: 'createdAt', direction: 'desc' }, 200);
    res.json({ items: viewings, total: viewings.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lettings/viewings/:id — get single viewing
lettingsRouter.get('/viewings/:id', async (req, res, next) => {
  try {
    const viewing = await getDoc<any>(collections.viewings, req.params.id);
    if (!viewing) return res.status(404).json({ error: 'Viewing not found' });
    res.json(viewing);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/lettings/viewings — create a new viewing booking
lettingsRouter.post('/viewings', async (req, res, next) => {
  try {
    const { propertyId, name, email, phone, preferredDate, preferredTime, message } = req.body;

    if (!propertyId || !name || !email || !phone || !preferredDate) {
      return res.status(400).json({ error: 'Missing required fields: propertyId, name, email, phone, preferredDate' });
    }

    // Verify property exists
    const property = await getDoc<any>(collections.properties, propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const now = new Date().toISOString();
    const viewingData = {
      propertyId,
      propertyAddress: property.address,
      propertyPostcode: property.postcode,
      name,
      email,
      phone,
      preferredDate,
      preferredTime: preferredTime || 'morning',
      message: message || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const id = await addDoc(collections.viewings, viewingData);
    res.status(201).json({ id, ...viewingData });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/lettings/viewings/:id — update viewing status
lettingsRouter.patch('/viewings/:id', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (notes) updates.notes = notes;

    await updateDoc(collections.viewings, req.params.id, updates);
    const updated = await getDoc<any>(collections.viewings, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
