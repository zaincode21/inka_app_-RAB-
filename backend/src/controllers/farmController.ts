import { asyncHandler } from '../utils/asyncHandler.js';
import { systemConfigSchema } from '../schemas/resourceSchemas.js';
import { requireAuthUser } from '../middleware/auth.js';
import { ApiError } from '../utils/apiError.js';
import { canEditSystemConfig } from '../utils/permissions.js';
import * as farmService from '../services/farmService.js';

export const getSystemConfig = asyncHandler(async (request, response) => {
  const auth = requireAuthUser(request);
  const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
  const farmId = await farmService.resolveFarmIdForRequest(auth, requested);
  response.json(await farmService.getSystemConfig(farmId));
});

export const patchSystemConfig = asyncHandler(async (request, response) => {
  const auth = requireAuthUser(request);
  if (!canEditSystemConfig(auth)) {
    throw new ApiError(403, 'Only farm owners can change system configuration.');
  }
  const body = systemConfigSchema.parse(request.body);
  const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
  const farmId = await farmService.resolveFarmIdForRequest(auth, requested);
  response.json(await farmService.updateSystemConfig(farmId, body));
});
