import type { Request, Response, NextFunction } from 'express';

// Placeholder auth middleware — permissive for v1.
// In production, verify Firebase ID token from Authorization header.
export interface AuthUser {
  uid: string;
  email: string;
  persona: string;
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

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  // v1: no auth enforcement — attach a default user
  // In production: verify Firebase token from Authorization header
  const persona = (req.headers['x-persona'] as string) || 'housing-officer';
  req.user = {
    uid: 'default-user',
    email: 'sarah.mitchell@rcha.org.uk',
    persona,
    teamId: 'southwark-lewisham',
    patchIds: ['oak-park', 'elm-gardens'],
  };
  next();
}
