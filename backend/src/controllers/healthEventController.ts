import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as healthEventService from '../services/healthEventService.js';

function requireCattleTag(query: unknown): string {
  const cattleTag = typeof (query as { cattleTag?: unknown }).cattleTag === 'string'
    ? (query as { cattleTag: string }).cattleTag.trim()
    : '';
  if (!cattleTag) {
    throw new ApiError(400, 'cattleTag query parameter is required.');
  }
  return cattleTag;
}

export const getLatestBreeding = asyncHandler(async (request, response) => {
  const cattleTag = requireCattleTag(request.query);
  response.json(await healthEventService.getLatestBreedingByCattleTag(cattleTag));
});

export const getBirthPrefill = asyncHandler(async (request, response) => {
  const cattleTag = requireCattleTag(request.query);
  response.json(await healthEventService.getBirthPrefillByCattleTag(cattleTag));
});

export const getMilkWithdrawal = asyncHandler(async (request, response) => {
  const cattleTag = requireCattleTag(request.query);
  const onDateRaw = typeof request.query.onDate === 'string' ? request.query.onDate.trim() : undefined;
  response.json(await healthEventService.getMilkWithdrawalStatus(cattleTag, onDateRaw || undefined));
});
