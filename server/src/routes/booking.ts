import { Router } from 'express';
import { collections, getDocs, getDoc, addDoc, updateDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';

export const bookingRouter = Router();
bookingRouter.use(authMiddleware);

// GET /api/v1/booking/applications — list all applications
bookingRouter.get('/applications', async (_req, res, next) => {
  try {
    const applications = await getDocs<any>(collections.applications, undefined, { field: 'createdAt', direction: 'desc' }, 200);
    res.json({ items: applications, total: applications.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/booking/applications/:id — get single application
bookingRouter.get('/applications/:id', async (req, res, next) => {
  try {
    const application = await getDoc<any>(collections.applications, req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/booking/apply — create a new application
bookingRouter.post('/apply', async (req, res, next) => {
  try {
    const {
      propertyId,
      firstName,
      lastName,
      email,
      phone,
      currentAddress,
      employmentStatus,
      annualIncome,
      moveInDate,
      householdSize,
      additionalInfo,
    } = req.body;

    if (!propertyId || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields: propertyId, firstName, lastName, email, phone' });
    }

    // Verify property exists
    const property = await getDoc<any>(collections.properties, propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const now = new Date().toISOString();
    const applicationData = {
      propertyId,
      propertyAddress: property.address,
      propertyPostcode: property.postcode,
      firstName,
      lastName,
      email,
      phone,
      currentAddress: currentAddress || '',
      employmentStatus: employmentStatus || '',
      annualIncome: annualIncome || 0,
      moveInDate: moveInDate || '',
      householdSize: householdSize || 1,
      additionalInfo: additionalInfo || '',
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };

    const id = await addDoc(collections.applications, applicationData);
    res.status(201).json({ id, ...applicationData });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/booking/applications/:id — update application status
bookingRouter.patch('/applications/:id', async (req, res, next) => {
  try {
    const { status, notes, reviewedBy } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (reviewedBy) updates.reviewedBy = reviewedBy;

    await updateDoc(collections.applications, req.params.id, updates);
    const updated = await getDoc<any>(collections.applications, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
