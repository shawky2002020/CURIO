import { Router } from 'express';
import { productController } from './product.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import { role } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './product.validation.js';

const router = Router();

router.get('/', productController.getAllCategories);
router.get('/:id', productController.getCategoryById);
router.post(
  '/',
  auth,
  role('admin'),
  validate(createCategorySchema),
  productController.createCategory
);
router.put(
  '/:id',
  auth,
  role('admin'),
  validate(updateCategorySchema),
  productController.updateCategory
);
router.delete('/:id', auth, role('admin'), productController.deleteCategory);
router.post('/:id/restore', auth, role('admin'), productController.restoreCategory);

export default router;
