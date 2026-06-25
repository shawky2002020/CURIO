import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { userService } from './user.service.js';
import { sanitizeUser } from '../../utils/sanitizeUser.js';

export class UserController {
  /**
   * GET /api/users/me
   */
  public getMe = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const user = await userService.getProfile(req.user._id.toString());
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: sanitizeUser(user),
    });
  });

  /**
   * PATCH /api/users/me
   */
  public updateMe = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const updatedUser = await userService.updateProfile(req.user._id.toString(), req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: sanitizeUser(updatedUser),
    });
  });

  /**
   * DELETE /api/users/me
   */
  public deleteMe = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    await userService.softDeleteProfile(req.user._id.toString());
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully (soft delete).',
    });
  });
}

export const userController = new UserController();
export default userController;
