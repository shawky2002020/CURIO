import { Router } from 'express';
import { productController } from './product.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import { role } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  createReviewSchema,
  updateReviewSchema,
} from './product.validation.js';

const router = Router();

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post(
  '/',
  auth,
  role('admin', 'seller'),
  validate(createProductSchema),
  productController.createProduct
);
router.put(
  '/:id',
  auth,
  role('admin', 'seller'),
  validate(updateProductSchema),
  productController.updateProduct
);
router.delete('/:id', auth, role('admin', 'seller'), productController.deleteProduct);

// ─── Reviews ──────────────────────────────────────────────────────────────────
router.get('/:productId/reviews', productController.getProductReviews);
router.post(
  '/:productId/reviews',
  auth,
  role('customer'),
  validate(createReviewSchema),
  productController.createReview
);
router.put(
  '/:productId/reviews/:reviewId',
  auth,
  validate(updateReviewSchema),
  productController.updateReview
);
router.delete('/:productId/reviews/:reviewId', auth, productController.deleteReview);

export default router;
