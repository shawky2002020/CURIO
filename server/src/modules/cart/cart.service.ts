import { Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { Product } from '../products/product.model.js';
import { Cart, ICart } from './cart.model.js';
import { PromoCode } from './promo.model.js';
import { ICartTotals } from './cart.types.js';
import { Setting } from '../admin/setting.model.js';

export class CartService {
  /**
   * Resolves, creates, and optionally merges guest cart into user cart.
   */
  public async getOrCreateCart(userId?: string, guestId?: string): Promise<ICart> {
    if (userId) {
      const userObjectId = new Types.ObjectId(userId);
      let userCart = await Cart.findOne({ userId: userObjectId });
      
      if (!userCart) {
        userCart = await Cart.create({ userId: userObjectId, items: [] });
      }

      // Check if we should merge a guest cart
      if (guestId) {
        const guestCart = await Cart.findOne({ guestId });
        if (guestCart && guestCart.items.length > 0) {
          // Merge items
          for (const guestItem of guestCart.items) {
            const userItemIndex = userCart.items.findIndex(
              (item) => item.productId.toString() === guestItem.productId.toString()
            );

            if (userItemIndex > -1) {
              // Add quantities
              userCart.items[userItemIndex].quantity += guestItem.quantity;
            } else {
              userCart.items.push({
                productId: guestItem.productId,
                quantity: guestItem.quantity,
              });
            }
          }

          // If user cart has no promo code but guest cart does, copy it
          if (!userCart.promoCode && guestCart.promoCode) {
            userCart.promoCode = guestCart.promoCode;
          }

          await userCart.save();
          // Delete guest cart to prevent multiple merges
          await Cart.deleteOne({ _id: guestCart._id });
        }
      }

      return userCart;
    } else if (guestId) {
      let guestCart = await Cart.findOne({ guestId });
      if (!guestCart) {
        guestCart = await Cart.create({ guestId, items: [] });
      }
      return guestCart;
    } else {
      throw new ApiError(400, 'User ID or Guest ID must be provided to retrieve cart.', 'BAD_REQUEST');
    }
  }

  /**
   * Adds an item to the cart.
   */
  public async addItem(
    productId: string,
    quantity: number,
    userId?: string,
    guestId?: string
  ): Promise<ICart> {
    if (quantity <= 0) {
      throw new ApiError(400, 'Quantity must be a positive integer.', 'INVALID_QUANTITY');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found.', 'PRODUCT_NOT_FOUND');
    }

    if (product.status !== 'active') {
      throw new ApiError(400, 'Product is no longer available.', 'PRODUCT_UNAVAILABLE');
    }

    if (product.stock < quantity) {
      throw new ApiError(
        400,
        `Insufficient stock. Only ${product.stock} units available.`,
        'INSUFFICIENT_STOCK'
      );
    }

    const cart = await this.getOrCreateCart(userId, guestId);
    const prodObjectId = new Types.ObjectId(productId);

    const existingItemIndex = cart.items.findIndex((item) => item.productId.equals(prodObjectId));

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        throw new ApiError(
          400,
          `Insufficient stock. You already have ${cart.items[existingItemIndex].quantity} in cart, and cannot add ${quantity} more. Stock limit: ${product.stock}`,
          'INSUFFICIENT_STOCK'
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ productId: prodObjectId, quantity });
    }

    await cart.save();
    return cart;
  }

  /**
   * Updates the quantity of an item in the cart.
   */
  public async updateItem(
    itemId: string,
    quantity: number,
    userId?: string,
    guestId?: string
  ): Promise<ICart> {
    if (quantity < 0) {
      throw new ApiError(400, 'Quantity cannot be negative.', 'INVALID_QUANTITY');
    }

    const cart = await this.getOrCreateCart(userId, guestId);
    const itemObjectId = new Types.ObjectId(itemId);
    const itemIndex = cart.items.findIndex((item) => item._id && item._id.equals(itemObjectId));

    if (itemIndex === -1) {
      throw new ApiError(404, 'Item not found in cart.', 'ITEM_NOT_FOUND');
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const productId = cart.items[itemIndex].productId;
      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'Product associated with this item does not exist.', 'PRODUCT_NOT_FOUND');
      }

      if (product.stock < quantity) {
        throw new ApiError(
          400,
          `Insufficient stock. Only ${product.stock} units available.`,
          'INSUFFICIENT_STOCK'
        );
      }

      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    return cart;
  }

  /**
   * Removes an item from the cart.
   */
  public async removeItem(itemId: string, userId?: string, guestId?: string): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const itemObjectId = new Types.ObjectId(itemId);
    
    cart.items = cart.items.filter((item) => !(item._id && item._id.equals(itemObjectId)));
    await cart.save();
    return cart;
  }

  /**
   * Clears all items and resets the promo code.
   */
  public async clearCart(userId?: string, guestId?: string): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = [];
    cart.promoCode = undefined;
    await cart.save();
    return cart;
  }

  /**
   * Applies a promo code to the cart.
   */
  public async applyPromo(code: string, userId?: string, guestId?: string): Promise<ICart> {
    const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() });
    if (!promo) {
      throw new ApiError(400, 'Invalid promo code.', 'INVALID_PROMO');
    }

    if (!promo.isActive) {
      throw new ApiError(400, 'Promo code has been deactivated.', 'PROMO_INACTIVE');
    }

    if (promo.expirationDate && promo.expirationDate.getTime() < Date.now()) {
      throw new ApiError(400, 'Promo code has expired.', 'PROMO_EXPIRED');
    }

    if (promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) {
      throw new ApiError(400, 'Promo code usage limit has been reached.', 'PROMO_LIMIT_REACHED');
    }

    const cart = await this.getOrCreateCart(userId, guestId);
    cart.promoCode = promo.code;
    await cart.save();
    return cart;
  }

  /**
   * Removes promo code from the cart.
   */
  public async removePromo(userId?: string, guestId?: string): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.promoCode = undefined;
    await cart.save();
    return cart;
  }

  /**
   * Populates the cart items and calculates totals.
   */
  public async getPopulatedCartWithTotals(cart: ICart): Promise<{ cart: any; totals: ICartTotals }> {
    const populated = await cart.populate({
      path: 'items.productId',
      select: 'name price stock images status slug',
    });

    let subtotal = 0;
    
    // Clean invalid items (e.g. deleted products)
    const validItems = populated.items.filter((item: any) => {
      if (item.productId) {
        subtotal += item.productId.price * item.quantity;
        return true;
      }
      return false;
    });

    let discount = 0;
    let promoDetails = null;

    if (cart.promoCode) {
      const promo = await PromoCode.findOne({ code: cart.promoCode });
      if (
        promo &&
        promo.isActive &&
        (!promo.expirationDate || promo.expirationDate.getTime() >= Date.now()) &&
        (promo.usageLimit === undefined || promo.usedCount < promo.usageLimit)
      ) {
        promoDetails = promo;
        if (promo.discountType === 'percentage') {
          discount = Math.round(subtotal * (promo.discountValue / 100) * 100) / 100;
        } else {
          discount = promo.discountValue;
        }
        // Discount cannot exceed subtotal
        if (discount > subtotal) {
          discount = subtotal;
        }
      } else {
        // Clear expired or deleted promo code
        cart.promoCode = undefined;
        await cart.save();
      }
    }

    // Retrieve current settings from database with fallback defaults
    const [taxRateSetting, shippingThresholdSetting, shippingCostSetting] = await Promise.all([
      Setting.findOne({ key: 'taxRate' }),
      Setting.findOne({ key: 'freeShippingThreshold' }),
      Setting.findOne({ key: 'shippingCost' }),
    ]);

    const taxRate = taxRateSetting ? Number(taxRateSetting.value) : 10;
    const freeShippingThreshold = shippingThresholdSetting ? Number(shippingThresholdSetting.value) : 100;
    const shippingCost = shippingCostSetting ? Number(shippingCostSetting.value) : 10;

    // Flat shipping rate, free over threshold
    const shipping = subtotal > 0 && subtotal < freeShippingThreshold ? shippingCost : 0;
    // tax percentage rate on the taxable amount (subtotal - discount)
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
    const total = Math.round((taxableAmount + shipping + tax) * 100) / 100;

    return {
      cart: {
        _id: populated._id,
        userId: populated.userId,
        guestId: populated.guestId,
        items: validItems,
        promoCode: cart.promoCode,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
      totals: {
        subtotal,
        discount,
        shipping,
        tax,
        taxRate,
        total,
      },
    };
  }
}

export const cartService = new CartService();
export default cartService;
