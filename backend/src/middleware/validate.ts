import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (request, _response, next) => {
    try {
      request.body = schema.parse(request.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (request, _response, next) => {
    try {
      request.query = schema.parse(request.query) as typeof request.query;
      next();
    } catch (error) {
      next(error);
    }
  };
}
