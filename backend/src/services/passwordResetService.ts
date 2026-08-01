import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { sendMail } from './mailService.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function buildResetMessage(email: string, token: string): string {
  const link = `${env.appPublicUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  return [
    'You requested a password reset for your Inka account.',
    '',
    `Reset code: ${token}`,
    '',
    `Or open this link and paste the code in the app: ${link}`,
    '',
    'This code expires in 1 hour. If you did not request a reset, ignore this message.',
    '',
    `(Account: ${email})`,
  ].join('\n');
}

export async function requestPasswordReset(emailRaw: string): Promise<{
  ok: true;
  message: string;
  devResetToken?: string;
}> {
  const email = emailRaw.trim().toLowerCase();
  const generic = {
    ok: true as const,
    message: 'If an account exists for that email, a reset code has been sent.',
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive || !user.passwordHash) {
    return generic;
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  try {
    await sendMail({
      to: user.email,
      subject: 'Inka password reset',
      text: buildResetMessage(user.email, token),
    });
  } catch (error) {
    console.error('[password-reset] Failed to send mail:', error);
    // Still return generic success to avoid email enumeration; token remains usable via logs in dev.
  }

  if (env.exposeDevResetToken) {
    return { ...generic, devResetToken: token };
  }

  return generic;
}

export async function resetPasswordWithToken(
  tokenRaw: string,
  newPassword: string,
): Promise<{ userId: string; farmId: string | null }> {
  const token = tokenRaw.trim();
  if (!token) {
    throw new ApiError(400, 'Reset token is required.');
  }

  const tokenHash = hashResetToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, isActive: true, farmId: true } } },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'Reset code is invalid or has expired.');
  }

  if (!record.user.isActive) {
    throw new ApiError(400, 'Account is inactive.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { userId: record.userId, farmId: record.user.farmId ?? null };
}
