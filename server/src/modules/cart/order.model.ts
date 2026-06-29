import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface IOrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface IOrder extends Document {
  userId?: Types.ObjectId;
  guestId?: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  promoCode?: string;
  totals: IOrderTotals;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  stripeSessionId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
});

const orderTotalsSchema = new Schema<IOrderTotals>({
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  shipping: { type: Number, required: true, min: 0, default: 0 },
  tax: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
});

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    guestId: {
      type: String,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    totals: {
      type: orderTotalsSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<IOrder>('Order', orderSchema);
