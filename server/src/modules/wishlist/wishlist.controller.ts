import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { wishlistService } from './wishlist.service.js';

export class WishlistController {
  /**
   * GET /api/wishlist
   */
  public getWishlist = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const wishlist = await wishlistService.getWishlist(req.user._id.toString());
    res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully.',
      data: wishlist,
    });
  });

  /**
   * POST /api/wishlist/:productId
   */
  public addToWishlist = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const { productId } = req.params;
    const wishlist = await wishlistService.addToWishlist(req.user._id.toString(), productId);
    res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully.',
      data: wishlist,
    });
  });

  /**
   * DELETE /api/wishlist/:productId
   */
  public removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const { productId } = req.params;
    const wishlist = await wishlistService.removeFromWishlist(req.user._id.toString(), productId);
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully.',
      data: wishlist,
    });
  });

  /**
   * DELETE /api/wishlist
   */
  public clearWishlist = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const wishlist = await wishlistService.clearWishlist(req.user._id.toString());
    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully.',
      data: wishlist,
    });
  });
}

export const wishlistController = new WishlistController();
export default wishlistController;
