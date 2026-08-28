import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-super-secret-key-tickets-system-2025';

export interface JwtPayloadUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadUser;
}

/**
 * Generates a signed JWT token
 */
export function generateToken(payload: { id: string; email: string; nombre: string; rol: UserRole }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Middleware to enforce authentication
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token JWT no suministrado.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadUser;
    req.user = decoded;
    return next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación expirado o inválido.',
      error: err.message,
    });
  }
}

/**
 * Optional authentication: decodes user if token provided, but doesn't block if missing
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadUser;
      req.user = decoded;
    } catch {
      // ignore invalid optional token
    }
  }
  return next();
}

/**
 * Role-Based Access Control (RBAC) Middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado: Debe autenticarse en el sistema.',
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso restringido: Se requiere rol de [${allowedRoles.join(', ')}]. Su rol actual es "${req.user.rol}".`,
      });
    }

    return next();
  };
}
