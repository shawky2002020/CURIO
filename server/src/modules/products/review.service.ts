import { Review, IReview } from './review.model.js';
import { productService } from './product.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { Types } from 'mongoose';

export class ReviewService {
  /**
   * Gets all reviews for a product, populated with user details.
   */
  public async getByProduct(productId: string): Promise<IReview[]> {
    return Review.find({ productId: new Types.ObjectId(productId) })
      .populate('userId', 'fullName avatarUrl')
      .sort({ createdAt: -1 });
  }

  /**
   * Creates a new review. Enforces one review per customer per product.
   */
  public async create(
    productId: string,
    userId: string,
    data: { rating: number; comment: string }
  ): Promise<IReview> {
    const existing = await Review.findOne({
      productId: new Types.ObjectId(productId),
      userId: new Types.ObjectId(userId),
    });

    if (existing) {
      throw new ApiError(
        409,
        'You have already reviewed this product. Edit your existing review.',
        'CONFLICT'
      );
    }

    const review = await Review.create({
      productId: new Types.ObjectId(productId),
      userId: new Types.ObjectId(userId),
      ...data,
    });

    await this.refreshRating(productId);
    return review.populate('userId', 'fullName avatarUrl');
  }

  /**
   * Updates the user's own review.
   */
  public async update(
    reviewId: string,
    userId: string,
    userRole: string,
    data: { rating?: number; comment?: string }
  ): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Review not found.', 'NOT_FOUND');
    }

    if (userRole !== 'admin' && review.userId.toString() !== userId) {
      throw new ApiError(403, 'You can only edit your own reviews.', 'FORBIDDEN');
    }

    if (data.rating !== undefined) review.rating = data.rating;
    if (data.comment !== undefined) review.comment = data.comment;

    await review.save();
    await this.refreshRating(review.productId.toString());
    return review.populate('userId', 'fullName avatarUrl');
  }

  /**
   * Deletes a review (owner or admin).
   */
  public async delete(reviewId: string, userId: string, userRole: string): Promise<void> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Review not found.', 'NOT_FOUND');
    }

    if (userRole !== 'admin' && review.userId.toString() !== userId) {
      throw new ApiError(403, 'You can only delete your own reviews.', 'FORBIDDEN');
    }

    const productId = review.productId.toString();
    await review.deleteOne();
    await this.refreshRating(productId);
  }

  /**
   * Refreshes the product's average rating after any review mutation.
   */
  private async refreshRating(productId: string): Promise<void> {
    const reviews = await Review.find({ productId: new Types.ObjectId(productId) });
    const ratings = reviews.map((r) => r.rating);
    await productService.recalculateRating(productId, ratings);
  }
}

export const reviewService = new ReviewService();
export default reviewService;
