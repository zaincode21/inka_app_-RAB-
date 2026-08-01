import { farmSchema, updateFarmSchema } from '../schemas/resourceSchemas.js';
import { getSystemConfig, patchSystemConfig } from '../controllers/farmController.js';
import { createCrudRouter, models } from '../lib/createCrudRouter.js';
import { isSuperAdmin, type AuthUser } from '../utils/permissions.js';
import { requireAnyRole } from '../middleware/auth.js';
import { ApiError, notFound } from '../utils/apiError.js';
import { Router } from 'express';

function assertFarmRowAccess(auth: AuthUser, record: Record<string, unknown>) {
  if (isSuperAdmin(auth)) {
    return;
  }
  const id = typeof record.id === 'string' ? record.id : null;
  if (!auth.farmId || id !== auth.farmId) {
    throw notFound('Farm');
  }
}

const farmCrud = createCrudRouter({
  model: models.farm,
  resourceName: 'Farm',
  createSchema: farmSchema,
  updateSchema: updateFarmSchema,
  defaultOrderBy: { createdAt: 'desc' },
  farmScoped: false,
  listWhere: (_query, auth) => {
    if (isSuperAdmin(auth)) {
      return {};
    }
    return auth.farmId ? { id: auth.farmId } : { id: '__none__' };
  },
  assertRecordAccess: (auth, record) => assertFarmRowAccess(auth, record),
  beforeCreate: async (_body, auth) => {
    if (!isSuperAdmin(auth)) {
      throw new ApiError(403, 'Only super admins can create farms directly.');
    }
  },
  canDelete: (auth) => isSuperAdmin(auth),
});

export const farmRouter = Router();

farmRouter.get('/system-config', getSystemConfig);
farmRouter.patch('/system-config', requireAnyRole('FARM_OWNER'), patchSystemConfig);
farmRouter.use(farmCrud);
