import { asyncHandler } from '../utils/asyncHandler.js';
import { systemConfigSchema } from '../schemas/resourceSchemas.js';
import * as farmService from '../services/farmService.js';

export const getSystemConfig = asyncHandler(async (_request, response) => {
  response.json(await farmService.getSystemConfig());
});

export const patchSystemConfig = asyncHandler(async (request, response) => {
  const body = systemConfigSchema.parse(request.body);
  response.json(await farmService.updateSystemConfig(body));
});
