import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { orderService } from './order.service.js';
import { ApiError } from '../../utils/ApiError.js';

export class OrderController {
  /**
   * POST /api/checkout
   */
  public checkout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.cartOwner?.userId;
    const guestId = req.cartOwner?.guestId;
    const { fullName, email, phone, address, city, country, postalCode, paymentMethod } = req.body;

    // Validate checkout fields
    const errors: Record<string, string[]> = {};
    if (!fullName) errors.fullName = ['Full name is required.'];
    if (!email) {
      errors.email = ['Email address is required.'];
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = ['Please provide a valid email address.'];
      }
    }
    if (!phone) errors.phone = ['Phone number is required.'];
    if (!address) errors.address = ['Street address is required.'];
    if (!city) errors.city = ['City is required.'];
    if (!country) errors.country = ['Country is required.'];
    if (!postalCode) errors.postalCode = ['Postal code is required.'];

    if (Object.keys(errors).length > 0) {
      throw new ApiError(400, 'Checkout validation failed.', 'VALIDATION_ERROR', errors);
    }

    const shippingAddress = { fullName, email, phone, address, city, country, postalCode };

    const { order, checkoutUrl } = await orderService.checkout(
      shippingAddress,
      userId,
      guestId,
      paymentMethod
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: {
        order,
        checkoutUrl,
      },
    });
  });

  /**
   * POST /api/orders/:id/verify-payment
   */
  public verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { sessionId } = req.body;
    const userId = req.cartOwner?.userId;
    const guestId = req.cartOwner?.guestId;

    const order = await orderService.verifyPayment(id, sessionId, userId, guestId);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      data: order,
    });
  });

  /**
   * GET /api/orders
   */
  public getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required to fetch order history.', 'UNAUTHORIZED');
    }

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const orders = await orderService.getOrdersForRole(
      req.user._id.toString(),
      req.user.role,
      page,
      limit,
      search,
      status
    );

    res.status(200).json({
      success: true,
      message: 'Orders history retrieved successfully.',
      data: orders,
    });
  });

  /**
   * PATCH /api/orders/:id/status
   */
  public updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.', 'UNAUTHORIZED');
    }

    const order = await orderService.updateOrderStatus(id, status, {
      _id: req.user._id.toString(),
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: `Order status advanced to ${status} successfully.`,
      data: order,
    });
  });

  /**
   * GET /api/orders/:id
   */
  public getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = req.user
      ? { _id: req.user._id.toString(), role: req.user.role }
      : undefined;
    const requestingGuestId = req.headers['x-guest-id'] as string || req.cookies?.guestId;

    const order = await orderService.getOrderById(id, requestingUser, requestingGuestId);

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully.',
      data: order,
    });
  });
}

export const orderController = new OrderController();
export default orderController;
