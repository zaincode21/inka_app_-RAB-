import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthUser } from '../middleware/auth.js';
import { createUserSchema, updateUserSchema } from '../schemas/resourceSchemas.js';
import * as userService from '../services/userService.js';

export const listUsers = asyncHandler(async (request, response) => {
  const auth = requireAuthUser(request);
  const farmId = typeof request.query.farmId === 'string' ? request.query.farmId : undefined;
  response.json(await userService.listUsers(auth, farmId));
});

export const createUser = asyncHandler(async (request, response) => {
  const auth = requireAuthUser(request);
  const body = createUserSchema.parse(request.body);
  response.status(201).json(await userService.createFarmUser(auth, body));
});

export const updateUser = asyncHandler(async (request, response) => {
  const auth = requireAuthUser(request);
  const body = updateUserSchema.parse(request.body);
  response.json(await userService.updateFarmUser(auth, String(request.params.id), body));
});

export const getMe = asyncHandler(async (request, response) => {
  const auth = requireAuthUser(request);
  response.json({
    id: auth.id,
    email: auth.email,
    firstName: auth.firstName,
    lastName: auth.lastName,
    phone: auth.phone,
    role: auth.role,
    farmId: auth.farmId,
    isActive: auth.isActive,
  });
});
