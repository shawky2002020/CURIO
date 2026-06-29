import { Types } from 'mongoose';
import { IProduct } from '../products/product.model.js';
import { ICart, ICartItem } from './cart.model.js';

export interface IPopulatedCartItem {
  _id: Types.ObjectId;
  productId: IProduct;
  quantity: number;
}

export interface IPopulatedCart {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  guestId?: string;
  items: IPopulatedCartItem[];
  promoCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  taxRate?: number;
  total: number;
}

export interface ICartResponse {
  cart: ICart;
  totals: ICartTotals;
}
