import { Router } from 'express';
import { sellerController } from './seller.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import { role } from '../../middlewares/role.middleware.js';
import { uploadSingle } from '../../middlewares/upload.middleware.js';

const router = Router();

router.get('/dashboard', auth, role('seller', 'admin'), sellerController.getDashboard);
router.post('/upload-logo', auth, role('seller'), uploadSingle('logo'), sellerController.uploadLogo);

export default router;

