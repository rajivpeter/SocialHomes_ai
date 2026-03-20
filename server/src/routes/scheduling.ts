import { Router } from 'express';
import { collections, db, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';

export const schedulingRouter = Router();
schedulingRouter.use(authMiddleware);

// ---- Firestore Collections ----
const operativesCol = db.collection('operatives');
const appointmentsCol = db.collection('appointments');
const diaryBlocksCol = db.collection('diaryBlocks');

// ---- Seed Data ----
const SEED_OPERATIVES = [
  {
    id: 'op-001',
    name: 'James Hargreaves',
    trade: 'plumbing',
    email: 'james.hargreaves@socialhomes.ai',
    phone: '07700 100001',
    maxJobsPerDay: 4,
    available: true,
    region: 'North West',
    qualifications: ['Gas Safe Registered', 'NVQ Level 3 Plumbing'],
  },
  {
    id: 'op-002',
    name: 'Aisha Patel',
    trade: 'electrical',
    email: 'aisha.patel@socialhomes.ai',
    phone: '07700 100002',
    maxJobsPerDay: 5,
    available: true,
    region: 'North West',
    qualifications: ['18th Edition Wiring', 'Part P Certified'],
  },
  {
    id: 'op-003',
    name: 'David Williams',
    trade: 'general',
    email: 'david.williams@socialhomes.ai',
    phone: '07700 100003',
    maxJobsPerDay: 6,
    available: true,
    region: 'North West',
    qualifications: ['NVQ Level 2 Maintenance', 'CSCS Card'],
  },
  {
    id: 'op-004',
    name: 'Sophie Chen',
    trade: 'roofing',
    email: 'sophie.chen@socialhomes.ai',
    phone: '07700 100004',
    maxJobsPerDay: 3,
    available: true,
    region: 'North West',
    qualifications: ['NVQ Level 3 Roofing', 'Working at Height Certified'],
  },
  {
    id: 'op-005',
    name: 'Marcus Johnson',
    trade: 'carpentry',
    email: 'marcus.johnson@socialhomes.ai',
    phone: '07700 100005',
    maxJobsPerDay: 5,
    available: false,
    region: 'North West',
    qualifications: ['NVQ Level 3 Carpentry', 'City & Guilds Joinery'],
  },
];

/**
 * Seed operatives into Firestore if the collection is empty.
 * Called lazily on first operative-related request.
 */
let seeded = false;
async function ensureOperativesSeeded(): Promise<void> {
  if (seeded) return;
  const snapshot = await operativesCol.limit(1).get();
  if (snapshot.empty) {
    const batch = db.batch();
    for (const op of SEED_OPERATIVES) {
      batch.set(operativesCol.doc(op.id), op);
    }
    await batch.commit();
  }
  seeded = true;
}

// ---- Operative Interfaces ----
interface Operative {
  id: string;
  name: string;
  trade: string;
  email: string;
  phone: string;
  maxJobsPerDay: number;
  available: boolean;
  region: string;
  qualifications: string[];
}

interface Appointment {
  id: string;
  caseId: string;
  operativeId: string;
  operativeName: string;
  date: string;        // YYYY-MM-DD
  timeSlot: 'morning' | 'afternoon';
  propertyId: string;
  tenantId: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no-access';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DiaryBlock {
  id: string;
  operativeId: string;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  reason: 'holiday' | 'training' | 'sick' | 'other';
  notes?: string;
  createdAt: string;
}

interface Slot {
  date: string;
  timeSlot: 'morning' | 'afternoon';
  operativeId: string;
  operativeName: string;
  available: boolean;
}

// =========================================================
// GET /scheduling/operatives — List all operatives
// Query: ?trade=plumbing&available=true
// =========================================================
schedulingRouter.get('/operatives', async (req, res, next) => {
  try {
    await ensureOperativesSeeded();
    const { trade, available } = req.query;

    let operatives = await getDocs<Operative>(operativesCol as any, undefined, undefined, 100);

    if (trade) {
      operatives = operatives.filter(o => o.trade === trade);
    }
    if (available !== undefined) {
      const isAvailable = available === 'true';
      operatives = operatives.filter(o => o.available === isAvailable);
    }

    res.json({ items: operatives, total: operatives.length });
  } catch (err) {
    next(err);
  }
});

// =========================================================
// GET /scheduling/operatives/:id — Get single operative
// =========================================================
schedulingRouter.get('/operatives/:id', async (req, res, next) => {
  try {
    await ensureOperativesSeeded();
    const operative = await getDoc<Operative>(operativesCol as any, req.params.id);
    if (!operative) return res.status(404).json({ error: 'Operative not found' });
    res.json(operative);
  } catch (err) {
    next(err);
  }
});

// =========================================================
// GET /scheduling/slots — Available appointment slots
// Query: ?date=2026-03-25&trade=plumbing&operativeId=op-001
// =========================================================
schedulingRouter.get('/slots', async (req, res, next) => {
  try {
    await ensureOperativesSeeded();
    const { date, trade, operativeId } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
    }

    const dateStr = date as string;

    // Get operatives matching filters
    let operatives = await getDocs<Operative>(operativesCol as any, undefined, undefined, 100);
    operatives = operatives.filter(o => o.available);
    if (trade) operatives = operatives.filter(o => o.trade === trade);
    if (operativeId) operatives = operatives.filter(o => o.id === operativeId);

    // Get existing appointments for the date
    const allAppointments = await getDocs<Appointment>(appointmentsCol as any, undefined, undefined, 1000);
    const dateAppointments = allAppointments.filter(
      a => a.date === dateStr && a.status !== 'cancelled'
    );

    // Get diary blocks that overlap with the date
    const allBlocks = await getDocs<DiaryBlock>(diaryBlocksCol as any, undefined, undefined, 500);
    const activeBlocks = allBlocks.filter(
      b => dateStr >= b.startDate && dateStr <= b.endDate
    );

    const timeSlots: Array<'morning' | 'afternoon'> = ['morning', 'afternoon'];
    const slots: Slot[] = [];

    for (const op of operatives) {
      // Check if operative is blocked on this date
      const isBlocked = activeBlocks.some(b => b.operativeId === op.id);
      if (isBlocked) {
        for (const ts of timeSlots) {
          slots.push({
            date: dateStr,
            timeSlot: ts,
            operativeId: op.id,
            operativeName: op.name,
            available: false,
          });
        }
        continue;
      }

      // Count appointments for this operative on this date
      const opAppointments = dateAppointments.filter(a => a.operativeId === op.id);
      const morningCount = opAppointments.filter(a => a.timeSlot === 'morning').length;
      const afternoonCount = opAppointments.filter(a => a.timeSlot === 'afternoon').length;
      const totalCount = opAppointments.length;

      // Each slot can hold max half of maxJobsPerDay (split between morning/afternoon)
      const maxPerSlot = Math.ceil(op.maxJobsPerDay / 2);

      for (const ts of timeSlots) {
        const slotCount = ts === 'morning' ? morningCount : afternoonCount;
        slots.push({
          date: dateStr,
          timeSlot: ts,
          operativeId: op.id,
          operativeName: op.name,
          available: slotCount < maxPerSlot && totalCount < op.maxJobsPerDay,
        });
      }
    }

    res.json(slots);
  } catch (err) {
    next(err);
  }
});

// =========================================================
// POST /scheduling/appointments — Book an appointment
// Body: { caseId, operativeId, date, timeSlot, propertyId, tenantId, notes }
// =========================================================
schedulingRouter.post('/appointments', async (req, res, next) => {
  try {
    const { caseId, operativeId, date, timeSlot, propertyId, tenantId, notes } = req.body;

    if (!caseId || !operativeId || !date || !timeSlot || !propertyId || !tenantId) {
      return res.status(400).json({
        error: 'Missing required fields: caseId, operativeId, date, timeSlot, propertyId, tenantId',
      });
    }

    if (!['morning', 'afternoon'].includes(timeSlot)) {
      return res.status(400).json({ error: 'timeSlot must be "morning" or "afternoon"' });
    }

    // Look up operative name
    const operative = await getDoc<Operative>(operativesCol as any, operativeId);
    if (!operative) {
      return res.status(404).json({ error: 'Operative not found' });
    }

    const now = new Date().toISOString();
    const id = `appt-${Date.now()}`;
    const appointment: Appointment = {
      id,
      caseId,
      operativeId,
      operativeName: operative.name,
      date,
      timeSlot,
      propertyId,
      tenantId,
      status: 'booked',
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(appointmentsCol as any, id, appointment);
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

// =========================================================
// GET /scheduling/appointments — List appointments
// Query: ?operativeId=&date=&status=
// =========================================================
schedulingRouter.get('/appointments', async (req, res, next) => {
  try {
    const { operativeId, date, status } = req.query;

    let appointments = await getDocs<Appointment>(appointmentsCol as any, undefined, undefined, 1000);

    if (operativeId) appointments = appointments.filter(a => a.operativeId === operativeId);
    if (date) appointments = appointments.filter(a => a.date === date);
    if (status) appointments = appointments.filter(a => a.status === status);

    // Sort by date descending, then morning before afternoon
    appointments.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return a.timeSlot === 'morning' ? -1 : 1;
    });

    res.json({ items: appointments, total: appointments.length });
  } catch (err) {
    next(err);
  }
});

// =========================================================
// PATCH /scheduling/appointments/:id — Update appointment
// Body: { date?, timeSlot?, status?, notes? }
// =========================================================
schedulingRouter.patch('/appointments/:id', async (req, res, next) => {
  try {
    const existing = await getDoc<Appointment>(appointmentsCol as any, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });

    const updates: Record<string, any> = {};
    const { date, timeSlot, status, notes } = req.body;

    if (date !== undefined) updates.date = date;
    if (timeSlot !== undefined) {
      if (!['morning', 'afternoon'].includes(timeSlot)) {
        return res.status(400).json({ error: 'timeSlot must be "morning" or "afternoon"' });
      }
      updates.timeSlot = timeSlot;
    }
    if (status !== undefined) {
      if (!['booked', 'completed', 'cancelled', 'no-access'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.status = status;
    }
    if (notes !== undefined) updates.notes = notes;
    updates.updatedAt = new Date().toISOString();

    await updateDoc(appointmentsCol as any, req.params.id, updates);
    const updated = await getDoc<Appointment>(appointmentsCol as any, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// =========================================================
// GET /scheduling/diary — Operative diary view
// Query: ?operativeId=op-001&weekStart=2026-03-23
// Returns: appointments + diary blocks for the week
// =========================================================
schedulingRouter.get('/diary', async (req, res, next) => {
  try {
    const { operativeId, weekStart } = req.query;

    if (!operativeId || !weekStart) {
      return res.status(400).json({ error: 'operativeId and weekStart query parameters are required' });
    }

    const startDate = weekStart as string;
    // Calculate end of week (7 days from start)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endDate = end.toISOString().split('T')[0];

    // Get appointments for the operative in this week
    const allAppointments = await getDocs<Appointment>(appointmentsCol as any, undefined, undefined, 1000);
    const weekAppointments = allAppointments.filter(
      a =>
        a.operativeId === operativeId &&
        a.date >= startDate &&
        a.date <= endDate
    );

    // Sort by date ascending, morning first
    weekAppointments.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.timeSlot === 'morning' ? -1 : 1;
    });

    // Get diary blocks that overlap this week
    const allBlocks = await getDocs<DiaryBlock>(diaryBlocksCol as any, undefined, undefined, 500);
    const weekBlocks = allBlocks.filter(
      b =>
        b.operativeId === operativeId &&
        b.startDate <= endDate &&
        b.endDate >= startDate
    );

    res.json({
      operativeId,
      weekStart: startDate,
      weekEnd: endDate,
      appointments: weekAppointments,
      diaryBlocks: weekBlocks,
    });
  } catch (err) {
    next(err);
  }
});

// =========================================================
// POST /scheduling/diary-blocks — Create diary block
// Body: { operativeId, startDate, endDate, reason, notes }
// =========================================================
schedulingRouter.post('/diary-blocks', async (req, res, next) => {
  try {
    const { operativeId, startDate, endDate, reason, notes } = req.body;

    if (!operativeId || !startDate || !endDate || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: operativeId, startDate, endDate, reason',
      });
    }

    if (!['holiday', 'training', 'sick', 'other'].includes(reason)) {
      return res.status(400).json({ error: 'reason must be one of: holiday, training, sick, other' });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: 'startDate must be on or before endDate' });
    }

    // Verify operative exists
    const operative = await getDoc<Operative>(operativesCol as any, operativeId);
    if (!operative) {
      return res.status(404).json({ error: 'Operative not found' });
    }

    const id = `block-${Date.now()}`;
    const block: DiaryBlock = {
      id,
      operativeId,
      startDate,
      endDate,
      reason,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    await setDoc(diaryBlocksCol as any, id, block);
    res.status(201).json(block);
  } catch (err) {
    next(err);
  }
});

// =========================================================
// DELETE /scheduling/diary-blocks/:id — Remove diary block
// =========================================================
schedulingRouter.delete('/diary-blocks/:id', async (req, res, next) => {
  try {
    const existing = await getDoc<DiaryBlock>(diaryBlocksCol as any, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Diary block not found' });

    await deleteDoc(diaryBlocksCol as any, req.params.id);
    res.json({ message: 'Diary block deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});
