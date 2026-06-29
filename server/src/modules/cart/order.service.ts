import { Types } from 'mongoose';
import Stripe from 'stripe';
import { ApiError } from '../../utils/ApiError.js';
import { Order, IOrder, IShippingAddress } from './order.model.js';
import { Product } from '../products/product.model.js';
import { cartService } from './cart.service.js';
import { env } from '../../config/env.js';
import { sendEmail } from '../../services/email.service.js';
import { getOrderConfirmationTemplate, getOrderStatusUpdateTemplate } from '../../utils/emailTemplates.js';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export class OrderService {
  /**
   * Processes cart checkout, creates a pending Order, and generates a Stripe session.
   */
  public async checkout(
    shippingAddress: IShippingAddress,
    userId?: string,
    guestId?: string
  ): Promise<{ order: IOrder; checkoutUrl?: string }> {
    // 1. Retrieve current cart
    const cart = await cartService.getOrCreateCart(userId, guestId);
    if (cart.items.length === 0) {
      throw new ApiError(400, 'Cannot place order. Your shopping cart is empty.', 'EMPTY_CART');
    }

    // 2. Populate and compute totals (also validates applied promo codes)
    const { cart: populatedCart, totals } = await cartService.getPopulatedCartWithTotals(cart);

    // 3. Verify stock and build snapshot order items
    const orderItems: any[] = [];
    
    for (const item of populatedCart.items) {
      const product = await Product.findById(item.productId._id);
      if (!product) {
        throw new ApiError(
          404,
          `Product "${item.productId.name}" no longer exists in our registry.`,
          'PRODUCT_NOT_FOUND'
        );
      }

      if (product.status !== 'active') {
        throw new ApiError(
          400,
          `Product "${product.name}" is no longer available.`,
          'PRODUCT_UNAVAILABLE'
        );
      }

      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}`,
          'INSUFFICIENT_STOCK'
        );
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      });
    }

    // 4. Create Order document (initially pending)
    const orderData: any = {
      items: orderItems,
      shippingAddress,
      totals,
      status: 'pending',
      paymentStatus: 'pending',
    };

    if (userId) {
      orderData.userId = new Types.ObjectId(userId);
    } else if (guestId) {
      orderData.guestId = guestId;
    }

    if (cart.promoCode) {
      orderData.promoCode = cart.promoCode;
    }

    const order = await Order.create(orderData);

    // 5. Decrement product stock immediately to reserve inventory during checkout session
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // 6. Generate Stripe session if Stripe is configured
    if (stripe) {
      try {
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderItems.map((item) => {
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name,
                images: item.image ? [item.image] : [],
              },
              unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
            },
            quantity: item.quantity,
          };
        });

        // Add shipping fee if applicable
        if (totals.shipping > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Shipping Fee',
                images: [],
              },
              unit_amount: Math.round(totals.shipping * 100),
            },
            quantity: 1,
          });
        }

        // Add tax if applicable
        if (totals.tax > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Tax (10%)',
                images: [],
              },
              unit_amount: Math.round(totals.tax * 100),
            },
            quantity: 1,
          });
        }

        // Add discount as a negative line item if applicable
        if (totals.discount > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Discount (${order.promoCode || 'PROMO'})`,
                images: [],
              },
              unit_amount: -Math.round(totals.discount * 100),
            },
            quantity: 1,
          });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${env.CLIENT_URL}/orders/${order._id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${env.CLIENT_URL}/checkout?cancelled=true`,
          client_reference_id: order._id.toString(),
          customer_email: shippingAddress.email,
        });

        order.stripeSessionId = session.id;
        await order.save();

        return { order, checkoutUrl: session.url || undefined };
      } catch (err: any) {
        console.error('[Stripe Error] Failed to create checkout session:', err);
        // Fallback to sandbox if stripe fails or has invalid keys during local testing
      }
    }

    // Fallback: If Stripe is not configured or fails, clear cart immediately and mark as processing (sandbox)
    await cartService.clearCart(userId, guestId);
    order.paymentStatus = 'paid';
    order.status = 'processing';
    await order.save();

    // Send confirmation email
    try {
      const emailHtml = getOrderConfirmationTemplate(order, env.CLIENT_URL);
      await sendEmail(order.shippingAddress.email, `CURIO // Order Confirmation #${order._id}`, emailHtml);
    } catch (emailErr) {
      console.error('[Email Error] Failed to send confirmation email:', emailErr);
    }

    return { order };
  }

  /**
   * Verifies the Stripe session status and transitions order status to paid / processing.
   */
  public async verifyPayment(
    orderId: string,
    sessionId: string,
    userId?: string,
    guestId?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }

    // If order is already paid, just return it
    if (order.paymentStatus === 'paid') {
      return order;
    }

    let paymentSuccess = false;

    if (stripe && sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
          paymentSuccess = true;
          order.stripeSessionId = sessionId;
        }
      } catch (err) {
        console.error('[Stripe Error] Verification failed:', err);
        throw new ApiError(400, 'Failed to verify payment session with Stripe.', 'PAYMENT_VERIFICATION_FAILED');
      }
    } else {
      // In sandbox mode without Stripe configured, treat any verify attempt as successful
      paymentSuccess = true;
    }

    if (paymentSuccess) {
      order.paymentStatus = 'paid';
      order.status = 'processing';
      await order.save();

      // Clear checkout owner's cart now that order is finalized
      await cartService.clearCart(userId, guestId);

      // Send confirmation email
      try {
        const emailHtml = getOrderConfirmationTemplate(order, env.CLIENT_URL);
        await sendEmail(order.shippingAddress.email, `CURIO // Order Confirmation #${order._id}`, emailHtml);
      } catch (emailErr) {
        console.error('[Email Error] Failed to send confirmation email:', emailErr);
      }
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      throw new ApiError(400, 'Order payment has not been completed.', 'PAYMENT_FAILED');
    }

    return order;
  }

  /**
   * Retrieves order history based on user role (Customers see their own, Sellers see their products, Admins see all).
   */
  public async getOrdersForRole(userId: string, role: string): Promise<IOrder[]> {
    if (role === 'admin') {
      return await Order.find({}).sort({ createdAt: -1 });
    }

    if (role === 'seller') {
      // Find all product IDs owned by this seller
      const sellerProductIds = await Product.find({ seller: new Types.ObjectId(userId) }).distinct('_id');
      // Find orders containing any of those product IDs
      return await Order.find({ 'items.productId': { $in: sellerProductIds } }).sort({ createdAt: -1 });
    }

    // Customer / Collector
    return await Order.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  /**
   * Updates status of an order and dispatches update notification email.
   */
  public async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    requestingUser: { _id: string; role: string }
  ): Promise<IOrder> {
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'seller') {
      throw new ApiError(403, 'Forbidden. Only admins and sellers can update order status.', 'FORBIDDEN');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }

    if (order.status === status) {
      return order;
    }

    const previousStatus = order.status;
    order.status = status;

    // Handle inventory replenishment on cancellation
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await order.save();

    // Trigger status update email
    try {
      const emailHtml = getOrderStatusUpdateTemplate(order, env.CLIENT_URL);
      await sendEmail(order.shippingAddress.email, `CURIO // Order status advanced to: ${status}`, emailHtml);
    } catch (emailErr) {
      console.error('[Email Error] Failed to send status update email:', emailErr);
    }

    return order;
  }

  /**
   * Retrieves order by ID with secure authorization checks.
   */
  public async getOrderById(
    orderId: string,
    requestingUser?: { _id: string; role: string },
    requestingGuestId?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }

    // Bypass check for admins or sellers
    if (requestingUser && (requestingUser.role === 'admin' || requestingUser.role === 'seller')) {
      return order;
    }

    // Check ownership
    if (order.userId) {
      if (!requestingUser || order.userId.toString() !== requestingUser._id.toString()) {
        throw new ApiError(403, 'Access denied. You do not own this order.', 'ACCESS_DENIED');
      }
    } else if (order.guestId) {
      if (!requestingGuestId || order.guestId !== requestingGuestId) {
        throw new ApiError(403, 'Access denied. Guest identifier does not match this order.', 'ACCESS_DENIED');
      }
    } else {
      throw new ApiError(403, 'Access denied. Order cannot be verified.', 'ACCESS_DENIED');
    }

    return order;
  }
}

export const orderService = new OrderService();
export default orderService;

