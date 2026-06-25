import { Router } from 'express';
import { userController } from './user.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './user.validation.js';

const router = Router();

// Protect all profile routes
router.use(auth);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);

export default router;
