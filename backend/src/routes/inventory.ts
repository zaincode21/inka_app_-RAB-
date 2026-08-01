import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  inventoryItemSchema,
  inventoryReceiveSchema,
  inventoryUseSchema,
  updateInventoryItemSchema,
} from '../schemas/resourceSchemas.js';
import {
  createInventoryItem,
  listInventoryItems,
  listInventoryMovements,
  receiveInventory,
  updateInventoryItem,
  useInventory,
} from '../services/inventoryService.js';

export const inventoryRouter = Router();

inventoryRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const requested = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
    response.json(await listInventoryItems(auth, requested));
  }),
);

inventoryRouter.post(
  '/',
  validateBody(inventoryItemSchema),
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    const item = await createInventoryItem(auth, request.body);
    response.status(201).json(item);
  }),
);

inventoryRouter.patch(
  '/:id',
  validateBody(updateInventoryItemSchema),
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    response.json(await updateInventoryItem(auth, String(request.params.id), request.body));
  }),
);

inventoryRouter.get(
  '/:id/movements',
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    response.json(await listInventoryMovements(auth, String(request.params.id)));
  }),
);

inventoryRouter.post(
  '/:id/receive',
  validateBody(inventoryReceiveSchema),
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    response.status(201).json(await receiveInventory(auth, String(request.params.id), request.body));
  }),
);

inventoryRouter.post(
  '/:id/use',
  validateBody(inventoryUseSchema),
  asyncHandler(async (request, response) => {
    const auth = requireAuthUser(request);
    response.status(201).json(await useInventory(auth, String(request.params.id), request.body));
  }),
);
