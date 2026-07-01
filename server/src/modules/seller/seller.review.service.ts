import { Review } from '../products/review.model.js';
import { Product } from '../products/product.model.js';
import { Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';

export class SellerReviewService {
  /**
   * Fetch reviews left on products owned by this seller.
   */
  public async getSellerReviews(
    sellerId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Find all product IDs owned by this seller partner
    const sellerProductIds = await Product.find({
      seller: new Types.ObjectId(sellerId),
      deletedAt: null,
    }).distinct('_id');

    const query = { productId: { $in: sellerProductIds } };

    const total = await Review.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const reviews = await Review.find(query)
      .populate('productId', 'name images')
      .populate('userId', 'fullName avatarUrl email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      reviews,
      total,
      pages,
      page,
      limit,
    };
  }

  /**
   * Submit or update a reply on a specific review.
   */
  public async replyToReview(
    reviewId: string,
    sellerId: string,
    replyText: string
  ) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Review not found.', 'REVIEW_NOT_FOUND');
    }

    const product = await Product.findById(review.productId);
    if (!product || product.deletedAt !== null) {
      throw new ApiError(404, 'Product associated with review not found.', 'PRODUCT_NOT_FOUND');
    }

    // Verify ownership of the product
    if (product.seller.toString() !== sellerId) {
      throw new ApiError(403, 'Forbidden. You do not have permission to reply to this review.', 'FORBIDDEN');
    }

    review.sellerReply = (replyText || '').trim();
    await review.save();

    return review.populate([
      { path: 'productId', select: 'name images' },
      { path: 'userId', select: 'fullName avatarUrl' },
    ]);
  }
}

export const sellerReviewService = new SellerReviewService();
export default sellerReviewService;
