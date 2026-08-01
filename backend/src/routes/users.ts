import { Router } from 'express';
import { createUser, getMe, listUsers, updateUser } from '../controllers/userController.js';
import { requireAnyRole } from '../middleware/auth.js';

export const userRouter = Router();

userRouter.get('/me', getMe);
userRouter.get('/', requireAnyRole('FARM_OWNER'), listUsers);
userRouter.post('/', requireAnyRole('FARM_OWNER'), createUser);
userRouter.patch('/:id', requireAnyRole('FARM_OWNER'), updateUser);
