import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation failed.',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ message: 'A record with this unique value already exists.' });
      return;
    }
  }

  console.error(error);
  response.status(500).json({ message: 'Unexpected server error.' });
};
