import { Router } from 'express';
import { wishlistController } from './wishlist.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import { role } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { wishlistParamsSchema } from './wishlist.validation.js';

const router = Router();

router.use(auth);

router.get('/', wishlistController.getWishlist);
router.post('/:productId', validate(wishlistParamsSchema), wishlistController.addToWishlist);
router.delete('/:productId', validate(wishlistParamsSchema), wishlistController.removeFromWishlist);
router.delete('/', wishlistController.clearWishlist);

export default router;
