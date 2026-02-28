import type { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../services/firebase-admin.js';
import { collections, getDoc } from '../services/firestore.js';

export interface AuthUser {
  uid: string;
  email: string;
  persona: string;
  displayName?: string;
  teamId?: string;
  patchIds?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Default demo users for backward-compatible X-Persona header mode
const DEMO_PERSONAS: Record<string, AuthUser> = {
  'coo': {
    uid: 'demo-coo',
    email: 'helen.carter@rcha.org.uk',
    persona: 'coo',
    displayName: 'Helen Carter',
  },
  'head-of-housing': {
    uid: 'demo-head',
    email: 'james.wright@rcha.org.uk',
    persona: 'head-of-housing',
    displayName: 'James Wright',
    teamId: 'london',
  },
  'manager': {
    uid: 'demo-manager',
    email: 'priya.patel@rcha.org.uk',
    persona: 'manager',
    displayName: 'Priya Patel',
    teamId: 'southwark-lewisham',
  },
  'housing-officer': {
    uid: 'demo-ho',
    email: 'sarah.mitchell@rcha.org.uk',
    persona: 'housing-officer',
    displayName: 'Sarah Mitchell',
    teamId: 'southwark-lewisham',
    patchIds: ['oak-park', 'elm-gardens'],
  },
  'operative': {
    uid: 'demo-operative',
    email: 'mark.johnson@rcha.org.uk',
    persona: 'operative',
    displayName: 'Mark Johnson',
    teamId: 'southwark-lewisham',
  },
};

/**
 * Authentication middleware.
 *
 * Supports two modes:
 * 1. Firebase JWT: Authorization: Bearer <idToken>
 *    - Verifies the token, loads user profile from Firestore users collection
 *    - Falls back to custom claims for persona if no Firestore profile
 *
 * 2. Legacy X-Persona header (backward compatible for development/testing)
 *    - No token required, attaches a demo user with the specified persona
 *    - Only active when no Authorization header is present
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Firebase JWT mode
    const idToken = authHeader.slice(7);
    verifyIdToken(idToken)
      .then(async (decoded) => {
        // Try to load full user profile from Firestore
        const userProfile = await getDoc<any>(collections.users, decoded.uid);

        req.user = {
          uid: decoded.uid,
          email: decoded.email || '',
          persona: userProfile?.persona || decoded.persona || 'housing-officer',
          displayName: decoded.name || userProfile?.displayName,
          teamId: userProfile?.teamId,
          patchIds: userProfile?.patchIds,
        };
        next();
      })
      .catch((err) => {
        console.error('Firebase auth error:', err.message);
        res.status(401).json({ error: 'Invalid or expired authentication token' });
      });
  } else {
    // In production, reject requests without a valid Bearer token
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Development/testing only: Legacy X-Persona fallback
    console.warn(`[AUTH] X-Persona fallback used for ${req.method} ${req.path} (dev mode only)`);
    const persona = (req.headers['x-persona'] as string) || 'housing-officer';
    req.user = DEMO_PERSONAS[persona] || DEMO_PERSONAS['housing-officer'];
    next();
  }
}
