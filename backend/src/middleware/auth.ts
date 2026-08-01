import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import type { AuthUser } from '../utils/permissions.js';
import { asyncHandler } from '../utils/asyncHandler.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export const authenticate = asyncHandler(async (request: Request, _response: Response, next: NextFunction) => {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required.');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new ApiError(401, 'Authentication required.');
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired token.');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      role: true,
      farmId: true,
      isActive: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account is inactive or not found.');
  }

  request.auth = user;
  next();
});

/** Require one of the listed roles. Super Admin is always allowed. */
export function requireAnyRole(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const user = request.auth;
    if (!user) {
      next(new ApiError(401, 'Authentication required.'));
      return;
    }
    if (user.role === 'SUPER_ADMIN' || roles.includes(user.role)) {
      next();
      return;
    }
    next(new ApiError(403, 'You do not have permission for this action.'));
  };
}

export function requireAuthUser(request: Request): AuthUser {
  if (!request.auth) {
    throw new ApiError(401, 'Authentication required.');
  }
  return request.auth;
}
