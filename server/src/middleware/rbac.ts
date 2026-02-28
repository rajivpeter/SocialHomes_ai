import type { Request, Response, NextFunction } from 'express';
import { ApiError } from './error-handler.js';

type PersonaLevel = 'coo' | 'head-of-service' | 'manager' | 'housing-officer' | 'operative' | 'pending-approval';

const personaHierarchy: Record<PersonaLevel, number> = {
  'coo': 5,
  'head-of-service': 4,
  'manager': 3,
  'housing-officer': 2,
  'operative': 1,
  'pending-approval': 0,
};

/**
 * Require minimum persona level for access.
 * e.g. requirePersona('manager') allows manager, head-of-service, and coo.
 */
export function requirePersona(minLevel: PersonaLevel) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userPersona = (req.user?.persona || 'operative') as PersonaLevel;
    const userLevel = personaHierarchy[userPersona] ?? 0;
    const requiredLevel = personaHierarchy[minLevel] ?? 0;

    if (userLevel >= requiredLevel) {
      next();
    } else {
      next(new ApiError(`Insufficient permissions. Required: ${minLevel}, got: ${userPersona}`, 403));
    }
  };
}
