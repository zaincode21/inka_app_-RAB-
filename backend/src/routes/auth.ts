import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import type { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { authenticate, requireAuthUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../schemas/resourceSchemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { registerFarmOwner } from '../services/userService.js';
import { requestPasswordReset, resetPasswordWithToken } from '../services/passwordResetService.js';
import { writeAudit } from '../services/auditService.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (request, response) => {
    const body = request.body as {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      farmName: string;
      district: string;
      sector: string;
    };

    const user = await registerFarmOwner(body);
    response.status(201).json(createAuthResponse(user));
  }),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (request, response) => {
    const { email, password } = request.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user?.passwordHash || !user.isActive) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    await writeAudit({
      actorId: user.id,
      farmId: user.farmId,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      summary: `Signed in (${user.email})`,
    });

    response.json(createAuthResponse(user));
  }),
);

authRouter.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (request, response) => {
    const { email } = request.body as { email: string };
    const result = await requestPasswordReset(email);
    response.json(result);
  }),
);

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(async (request, response) => {
    const { token, newPassword } = request.body as { token: string; newPassword: string };
    const result = await resetPasswordWithToken(token, newPassword);
    await writeAudit({
      actorId: result.userId,
      farmId: result.farmId,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: result.userId,
      summary: 'Password reset via reset code',
    });
    response.json({ ok: true, message: 'Password reset successfully. You can log in with your new password.' });
  }),
);

authRouter.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user?.passwordHash || !user.isActive) {
      throw new ApiError(401, 'Account is inactive or not found.');
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new ApiError(400, 'Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await writeAudit({
      auth,
      farmId: user.farmId,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: user.id,
      summary: 'Changed account password',
    });

    response.json({ ok: true, message: 'Password updated successfully.' });
  }),
);

function createAuthResponse(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  farmId: string | null;
}) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, farmId: user.farmId },
    env.jwtSecret,
    { expiresIn: '7d' },
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      farmId: user.farmId,
    },
  };
}
