import { Wishlist, IWishlist } from './wishlist.model.js';
import { Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';

export class WishlistService {
  /**
   * Gets or creates a wishlist for a user.
   */
  public async getWishlist(userId: string): Promise<IWishlist> {
    let wishlist = await Wishlist.findOne({ userId: new Types.ObjectId(userId) });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: new Types.ObjectId(userId),
        items: [],
      });
    }
    return wishlist.populate({
      path: 'items.productId',
      populate: {
        path: 'categoryId',
        select: 'name slug',
      },
    });
  }

  /**
   * Adds a product to the user's wishlist.
   */
  public async addToWishlist(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({ userId: new Types.ObjectId(userId) });
    if (!wishlist) {
      throw new ApiError(404, 'Wishlist not found.', 'NOT_FOUND');
    }
    const prodId = new Types.ObjectId(productId);

    // Prevent duplicates
    const exists = wishlist.items.some((item) => item.productId.equals(prodId));
    if (!exists) {
      wishlist.items.push({ productId: prodId, addedAt: new Date() });
      await wishlist.save();
    }
    return wishlist.populate({
      path: 'items.productId',
      populate: {
        path: 'categoryId',
        select: 'name slug',
      },
    });
  }

  /**
   * Removes a product from the user's wishlist.
   */
  public async removeFromWishlist(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({ userId: new Types.ObjectId(userId) });
    if (!wishlist) {
      throw new ApiError(404, 'Wishlist not found.', 'NOT_FOUND');
    }
    const prodId = new Types.ObjectId(productId);

    wishlist.items = wishlist.items.filter((item) => !item.productId.equals(prodId));
    await wishlist.save();
    return wishlist.populate({
      path: 'items.productId',
      populate: {
        path: 'categoryId',
        select: 'name slug',
      },
    });
  }

  /**
   * Clears all items in the user's wishlist.
   */
  public async clearWishlist(userId: string): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({ userId: new Types.ObjectId(userId) });
    if (!wishlist) {
      throw new ApiError(404, 'Wishlist not found.', 'NOT_FOUND');
    }
    wishlist.items = [];
    await wishlist.save();
    return wishlist;
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
