import { Router } from 'express';
import bannerController from './banner.controller.js';

const router = Router();

// Public route to get active banners
router.get('/active', bannerController.getActiveBanners);

export default router;
