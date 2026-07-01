import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sellerService } from './seller.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { uploadFileBuffer } from '../../services/storage.service.js';

class SellerController {
  /**
   * GET /api/seller/dashboard
   * Retrieves dashboard statistics, charts, and recent records for the logged-in seller.
   */
  public getDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sellerId = (req.user as any)._id;
    const data = await sellerService.getDashboardData(sellerId);
    res.status(200).json({
      success: true,
      message: 'Seller dashboard retrieved successfully.',
      data,
    });
  });

  /**
   * POST /api/seller/upload-logo
   * Uploads a store logo to Cloudinary and returns its secure URL.
   */
  public uploadLogo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded.', 'NO_FILE_UPLOADED');
    }

    const logoUrl = await uploadFileBuffer(req.file.buffer, 'store_logos');
    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully.',
      data: {
        logoUrl,
      },
    });
  });
}

export const sellerController = new SellerController();
export default sellerController;

