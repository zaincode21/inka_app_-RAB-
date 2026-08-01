import { Router } from 'express';
import { healthEventSchema, updateHealthEventSchema } from '../schemas/resourceSchemas.js';
import {
  getBirthPrefill,
  getLatestBreeding,
  getMilkWithdrawal,
} from '../controllers/healthEventController.js';
import {
  afterHealthEventCreate,
  afterHealthEventUpdate,
  stripHealthEventExtras,
  validateHealthEventCreate,
  validateHealthEventUpdate,
} from '../services/healthEventService.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';

const healthEventCrud = createCrudRouter({
  model: models.healthEvent,
  resourceName: 'Health event',
  createSchema: healthEventSchema,
  updateSchema: updateHealthEventSchema,
  defaultOrderBy: { eventDate: 'desc' },
  include: {
    cattle: {
      select: {
        id: true,
        tagNumber: true,
      },
    },
  },
  listWhere: (query) => {
    const where: Record<string, unknown> = {
      ...(typeof query.farmId === 'string' ? { farmId: query.farmId } : {}),
      ...(typeof query.eventType === 'string'
        ? { eventType: { equals: query.eventType, mode: 'insensitive' as const } }
        : {}),
      ...(typeof query.cattleTag === 'string' ? { cattle: { tagNumber: query.cattleTag } } : {}),
      ...(typeof query.cattleId === 'string' ? { cattleId: query.cattleId } : {}),
      ...(typeof query.scope === 'string' ? { scope: query.scope.toUpperCase() } : {}),
    };

    if (query.followUpDue === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.followUpDate = { lte: today, not: null };
    }

    return where;
  },
  createData: stripHealthEventExtras,
  updateData: stripHealthEventExtras,
  beforeCreate: validateHealthEventCreate,
  beforeUpdate: validateHealthEventUpdate,
  afterCreate: afterHealthEventCreate,
  afterUpdate: afterHealthEventUpdate,
});

export const healthEventRouter = Router();

healthEventRouter.get('/latest-breeding', getLatestBreeding);
healthEventRouter.get('/birth-prefill', getBirthPrefill);
healthEventRouter.get('/milk-withdrawal', getMilkWithdrawal);
healthEventRouter.use(healthEventCrud);
