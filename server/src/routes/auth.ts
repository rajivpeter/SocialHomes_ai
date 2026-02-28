import { Router } from 'express';
import {
  createAuthUser,
  setCustomClaims,
  getUserByEmail,
} from '../services/firebase-admin.js';
import { collections, setDoc, getDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePersona } from '../middleware/rbac.js';

export const authRouter = Router();

// Demo user accounts for seeding
// Password is loaded from DEMO_USER_PASSWORD env var (set via Secret Manager)
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || '';

const DEMO_USERS = [
  {
    email: 'helen.carter@rcha.org.uk',
    password: DEMO_PASSWORD,
    displayName: 'Helen Carter',
    persona: 'coo',
    teamId: undefined,
    patchIds: undefined,
  },
  {
    email: 'james.wright@rcha.org.uk',
    password: DEMO_PASSWORD,
    displayName: 'James Wright',
    persona: 'head-of-housing',
    teamId: 'london',
    patchIds: undefined,
  },
  {
    email: 'priya.patel@rcha.org.uk',
    password: DEMO_PASSWORD,
    displayName: 'Priya Patel',
    persona: 'manager',
    teamId: 'southwark-lewisham',
    patchIds: undefined,
  },
  {
    email: 'sarah.mitchell@rcha.org.uk',
    password: DEMO_PASSWORD,
    displayName: 'Sarah Mitchell',
    persona: 'housing-officer',
    teamId: 'southwark-lewisham',
    patchIds: ['oak-park', 'elm-gardens'],
  },
  {
    email: 'mark.johnson@rcha.org.uk',
    password: DEMO_PASSWORD,
    displayName: 'Mark Johnson',
    persona: 'operative',
    teamId: 'southwark-lewisham',
    patchIds: undefined,
  },
];

/**
 * POST /api/v1/auth/seed-users
 * Create demo Firebase Auth users and their Firestore profiles.
 * Idempotent — skips users that already exist.
 */
authRouter.post('/seed-users', authMiddleware, requirePersona('coo'), async (_req, res, next) => {
  try {
    const results = [];

    for (const user of DEMO_USERS) {
      let uid: string;
      let status: string;

      // Check if user already exists
      const existing = await getUserByEmail(user.email);
      if (existing) {
        uid = existing.uid;
        status = 'existing';
      } else {
        // Create Firebase Auth user
        const created = await createAuthUser(user.email, user.password, user.displayName);
        uid = created.uid;
        status = 'created';
      }

      // Set custom claims (persona role)
      await setCustomClaims(uid, { persona: user.persona });

      // Upsert Firestore user profile
      await setDoc(collections.users, uid, {
        id: uid,
        email: user.email,
        displayName: user.displayName,
        persona: user.persona,
        teamId: user.teamId || null,
        patchIds: user.patchIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      results.push({
        email: user.email,
        uid,
        persona: user.persona,
        status,
      });
    }

    res.json({ status: 'success', users: results });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/profile
 * Creates a user profile in Firestore on first registration.
 * Idempotent — only writes if profile doesn't exist yet.
 * Requires Authorization: Bearer <idToken>
 */
authRouter.post('/profile', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { verifyIdToken: verify } = await import('../services/firebase-admin.js');
    const decoded = await verify(authHeader.slice(7));

    // Check if profile already exists
    const existing = await getDoc<any>(collections.users, decoded.uid);
    if (existing) {
      return res.json({ status: 'existing', profile: existing });
    }

    // Create new profile on first registration
    const profile = {
      id: decoded.uid,
      email: decoded.email || '',
      displayName: decoded.name || req.body.name || '',
      persona: 'pending-approval', // Default to least-privilege; admin must approve
      teamId: null,
      patchIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(collections.users, decoded.uid, profile);
    res.status(201).json({ status: 'created', profile });
  } catch (err: any) {
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile.
 * Requires Authorization: Bearer <idToken>
 */
authRouter.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { verifyIdToken: verify } = await import('../services/firebase-admin.js');
    const decoded = await verify(authHeader.slice(7));

    // Load Firestore profile
    const profile = await getDoc<any>(collections.users, decoded.uid);

    res.json({
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name || profile?.displayName,
      persona: profile?.persona || decoded.persona || 'housing-officer',
      teamId: profile?.teamId,
      patchIds: profile?.patchIds || [],
    });
  } catch (err: any) {
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(err);
  }
});
