import { Router } from 'express';
import { sellerController } from './seller.controller.js';
import { sellerProductController } from './seller.product.controller.js';
import { sellerReviewController } from './seller.review.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import { role } from '../../middlewares/role.middleware.js';
import { uploadSingle, uploadMultiple } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema, updateStockSchema } from '../products/product.validation.js';

const router = Router();

router.get('/dashboard', auth, role('seller', 'admin'), sellerController.getDashboard);
router.post('/upload-logo', auth, role('seller'), uploadSingle('logo'), sellerController.uploadLogo);

// Seller Product Management Routes
router.get('/products', auth, role('seller'), sellerProductController.listProducts);
router.post('/products', auth, role('seller'), validate(createProductSchema), sellerProductController.createProduct);
router.put('/products/:id', auth, role('seller'), validate(updateProductSchema), sellerProductController.updateProduct);
router.patch('/products/:id/stock', auth, role('seller'), validate(updateStockSchema), sellerProductController.updateStock);
router.delete('/products/:id', auth, role('seller'), sellerProductController.deleteProduct);
router.post('/products/:id/images', auth, role('seller'), uploadMultiple('images'), sellerProductController.uploadImages);

// Seller Reviews Routes
router.get('/reviews', auth, role('seller'), sellerReviewController.getReviews);
router.post('/reviews/:reviewId/reply', auth, role('seller'), sellerReviewController.replyToReview);

export default router;

