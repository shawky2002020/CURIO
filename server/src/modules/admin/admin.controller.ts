import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminService } from './admin.service.js';

class AdminController {
  /**
   * GET /api/admin/dashboard
   * Returns consolidated dashboard data: stats, charts, and recent items.
   */
  public getDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await adminService.getDashboardData();

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully.',
      data,
    });
  });
}

export const adminController = new AdminController();
