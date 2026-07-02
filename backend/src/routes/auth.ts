import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/resourceSchemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (request, response) => {
    const { fullName, email, phone, password } = request.body as {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
    };
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists.');
    }

    const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName: lastNameParts.join(' ') || firstName,
        email: normalizedEmail,
        phone,
        passwordHash,
      },
    });

    response.status(201).json(createAuthResponse(user));
  }),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (request, response) => {
    const { email, password } = request.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user?.passwordHash) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    response.json(createAuthResponse(user));
  }),
);

function createAuthResponse(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
}) {
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    },
  };
}
