import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { bannerController } from '../banners/banner.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import { role } from '../../middlewares/role.middleware.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(auth, role('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.get('/sellers', adminController.getSellers);
router.get('/reviews', adminController.getReviews);
router.patch('/reviews/:id', adminController.updateReview);
router.delete('/reviews/:id', adminController.deleteReview);
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.patch('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.get('/banners', bannerController.getAllBanners);
router.post('/banners', bannerController.createBanner);
router.patch('/banners/:id', bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

// Admin Product Moderation
router.get('/products', adminController.getProducts);
router.patch('/products/:id/archive', adminController.archiveProduct);

export default router;
