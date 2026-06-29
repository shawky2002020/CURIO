import { Request, Response } from 'express';
import { bannerService } from './banner.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

class BannerController {
  /**
   * GET /api/banners/active
   * Retrieves active banners for customer homepage.
   */
  public getActiveBanners = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await bannerService.getActiveBanners();
    res.status(200).json({
      success: true,
      message: 'Active banners retrieved successfully.',
      data,
    });
  });

  /**
   * GET /api/admin/banners
   * Retrieves all banners for administration.
   */
  public getAllBanners = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await bannerService.getAllBanners(req.query);
    res.status(200).json({
      success: true,
      message: 'All banners retrieved successfully.',
      data,
    });
  });

  /**
   * POST /api/admin/banners
   * Creates a new banner.
   */
  public createBanner = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await bannerService.createBanner(req.body);
    res.status(201).json({
      success: true,
      message: 'Banner created successfully.',
      data,
    });
  });

  /**
   * PATCH /api/admin/banners/:id
   * Updates an existing banner.
   */
  public updateBanner = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await bannerService.updateBanner(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Banner updated successfully.',
      data,
    });
  });

  /**
   * DELETE /api/admin/banners/:id
   * Deletes a banner.
   */
  public deleteBanner = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await bannerService.deleteBanner(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully.',
    });
  });
}

export const bannerController = new BannerController();
export default bannerController;
