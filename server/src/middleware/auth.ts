import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';

export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`
});

export { requiredScopes };

interface Auth0Payload {
  sub?: string;
  email?: string;
  'https://cufc.app/email'?: string;
  'https://cufc.app/roles'?: string[];
  [key: string]: unknown;
}

export function requireRole(requiredRoles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = req.auth?.payload as Auth0Payload | undefined;
    const roles = payload?.['https://cufc.app/roles'] || [];
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!required.some(role => roles.includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

export function getAuth0Id(req: Request): string | undefined {
  return req.auth?.payload.sub;
}

export function getAuth0Email(req: Request): string | undefined {
  const payload = req.auth?.payload as Auth0Payload | undefined;
  // Check common locations for email in Auth0 tokens
  return payload?.email ?? payload?.['https://cufc.app/email'] ?? undefined;
}