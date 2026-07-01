import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sellerReviewService } from './seller.review.service.js';
import { ApiError } from '../../utils/ApiError.js';

export class SellerReviewController {
  /**
   * GET /api/seller/reviews
   */
  public getReviews = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.', 'UNAUTHORIZED');
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sellerId = req.user._id.toString();

    const data = await sellerReviewService.getSellerReviews(sellerId, { page, limit });

    res.status(200).json({
      success: true,
      message: 'Seller reviews retrieved successfully.',
      data,
    });
  });

  /**
   * POST /api/seller/reviews/:reviewId/reply
   */
  public replyToReview = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.', 'UNAUTHORIZED');
    }

    const { reviewId } = req.params;
    const { replyText } = req.body;
    const sellerId = req.user._id.toString();

    // Note: We allow empty string to clear the reply, but we check if it is passed in the body
    if (replyText === undefined) {
      throw new ApiError(400, 'replyText is required.', 'VALIDATION_ERROR');
    }

    const review = await sellerReviewService.replyToReview(reviewId, sellerId, replyText);

    res.status(200).json({
      success: true,
      message: 'Review reply updated successfully.',
      data: review,
    });
  });
}

export const sellerReviewController = new SellerReviewController();
export default sellerReviewController;
