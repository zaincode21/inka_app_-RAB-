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
  archiveLinkedEventTransactions,
  restoreLinkedEventTransactions,
  stripHealthEventExtras,
  validateHealthEventCreate,
  validateHealthEventUpdate,
} from '../services/healthEventService.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';
import { canDeleteEvents, canWriteEvents } from '../utils/permissions.js';

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
      ...(typeof query.eventType === 'string'
        ? { eventType: { equals: query.eventType, mode: 'insensitive' as const } }
        : {}),
      ...(typeof query.cattleTag === 'string' ? { cattle: { tagNumber: query.cattleTag, deletedAt: null } } : {}),
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
  createData: (body) => stripHealthEventExtras(body),
  updateData: (body) => stripHealthEventExtras(body),
  beforeCreate: async (body) => {
    await validateHealthEventCreate(body);
  },
  beforeUpdate: async (id, body) => {
    await validateHealthEventUpdate(id, body);
  },
  afterCreate: async (body, record, auth) => {
    await afterHealthEventCreate(body, record, auth.id);
  },
  afterUpdate: async (id, body, record) => {
    await afterHealthEventUpdate(id, body, record);
  },
  beforeDelete: async (id, _existing, auth) => {
    await archiveLinkedEventTransactions(id, auth.id);
  },
  afterRestore: async (id) => {
    await restoreLinkedEventTransactions(id);
  },
  canCreate: (auth) => canWriteEvents(auth),
  canUpdate: (auth) => canWriteEvents(auth),
  canDelete: (auth) => canDeleteEvents(auth),
  trackActor: true,
  softDelete: true,
  auditEntityType: 'HealthEvent',
});

export const healthEventRouter = Router();

healthEventRouter.get('/latest-breeding', getLatestBreeding);
healthEventRouter.get('/birth-prefill', getBirthPrefill);
healthEventRouter.get('/milk-withdrawal', getMilkWithdrawal);
healthEventRouter.use(healthEventCrud);
